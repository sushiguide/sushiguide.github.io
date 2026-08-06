#!/usr/bin/env python3
"""
Convert published Google Sheets CSV → data.json for Sushi Guide.
v2.0 scoring + delivery fields + incomplete flag.
"""

import csv
import json
import re
import urllib.request
from pathlib import Path

CSV_URL = (
    "https://docs.google.com/spreadsheets/d/e/"
    "2PACX-1vSZjm-0R6UpsrGm9IYop8q5yykjy8V6QdL_-rKmkxE6LJsEK5gT6JcWUKVrtA3RntdClDWbuW4hqgSy/"
    "pub?gid=0&single=true&output=csv"
)
OUT_PATH = Path("data.json")


def parse_num(val):
    if val is None:
        return None
    s = str(val).strip().replace(" ", "").replace("\xa0", "")
    if s in ("", "N/A", "n/a", "#DIV/0!", "#REF!", "#VALUE!", "-", "—", "–"):
        return None
    s = s.replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return None


def delivery_str(val):
    """Keep delivery fields as display strings (—, N/A, 50/100, 1500)."""
    if val is None:
        return None
    s = str(val).strip().replace("\xa0", " ")
    if s == "":
        return None
    if re.fullmatch(r"[\d\s]+,\d+", s):
        v = float(s.replace(" ", "").replace(",", "."))
        return str(int(v)) if v == int(v) else str(v)
    if re.fullmatch(r"\d+([\s]\d+)*", s):
        return str(int(s.replace(" ", "")))
    return s


def honesty_score(actual, declared):
    if actual is None or declared is None or declared == 0:
        return None
    ratio = actual / declared
    if ratio >= 1:
        return 10
    if ratio >= 0.97:
        return 8
    if ratio >= 0.94:
        return 6
    if ratio >= 0.90:
        return 4
    if ratio >= 0.85:
        return 2
    return 0


def salmon_qty_score(pct):
    if pct is None:
        return None
    if pct >= 30:
        return 10
    if pct >= 25:
        return 8
    if pct >= 20:
        return 6
    if pct >= 15:
        return 4
    if pct >= 10:
        return 2
    return 1


def pct_norm(v):
    if v is None:
        return None
    if 0 < v <= 1:
        return round(v * 100, 1)
    return v


def clean(v):
    if v is None:
        return None
    if isinstance(v, float) and v == int(v):
        return int(v)
    return v


def fetch_csv(url: str) -> list:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (compatible; SushiGuideBot/1.0)"},
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        raw = resp.read().decode("utf-8-sig")
    reader = csv.DictReader(raw.splitlines())
    return list(reader)


def convert(rows: list) -> list:
    places = []
    for row in rows:
        name = (row.get("Назва закладу") or "").strip()
        if not name:
            continue

        price = parse_num(row.get("Ціна"))
        price_discount = parse_num(row.get("Ціна зі знижкою"))
        declared = parse_num(row.get("Вага"))
        actual = parse_num(row.get("Фактична вага"))
        roll_weight = parse_num(row.get("~Вага рола"))
        rice_pct = pct_norm(parse_num(row.get("% Рису")))
        salmon_pct = pct_norm(parse_num(row.get("% Лосося")))
        cream_pct = pct_norm(parse_num(row.get("% Крем-сиру")))
        cucumber_pct = pct_norm(parse_num(row.get("% Огірка")))
        salmon_g = parse_num(row.get("~Кількість лосося"))

        rice = parse_num(row.get("Рис (1-6)"))
        seasoning = parse_num(row.get("Заправка  (1-4)"))
        salmon_q = parse_num(row.get("Лосось (1-10)"))
        cream = parse_num(row.get("Крем-сир (1-6)"))
        cucumber = parse_num(row.get("Огірок (1-4)"))
        balance = parse_num(row.get("Баланс (1-10)"))
        taste = parse_num(row.get("Смак (1-10)"))
        addons = parse_num(row.get("Соєвий соус і додатки  (0-5)"))
        packaging = parse_num(row.get("Пакування (1-10)"))
        order_conv = parse_num(row.get("Зручність замовлення (1-5)"))
        service = parse_num(row.get("Обслуговування (Оцінка)"))
        wait = parse_num(row.get("Час очікування (0-5)"))

        b_honesty = honesty_score(actual, declared)
        b_salmon = salmon_qty_score(salmon_pct)

        a_parts = [rice, seasoning, salmon_q, cream, cucumber, balance, taste]
        a_vals = [x for x in a_parts if x is not None]
        a_taste = round(sum(a_vals), 1) if a_vals else None

        b_vals = [x for x in (b_honesty, b_salmon) if x is not None]
        b_value = sum(b_vals) if b_vals else None

        c_completeness = addons
        d_vals = [x for x in (wait, service, order_conv) if x is not None]
        d_service = sum(d_vals) if d_vals else None
        e_delivery = packaging

        cats = {
            "A_taste": a_taste,
            "B_value": b_value,
            "C_completeness": c_completeness,
            "D_service": d_service,
            "E_delivery": e_delivery,
        }
        available = [v for v in cats.values() if v is not None]
        incomplete = any(v is None for v in cats.values())
        total = int(round(sum(available))) if available else None

        price_per_100g = None
        sheet_p100 = parse_num(row.get("Ціна/грам"))
        if sheet_p100 is not None and sheet_p100 < 10:
            price_per_100g = round(sheet_p100 * 100, 1)
        elif sheet_p100 is not None:
            price_per_100g = round(sheet_p100, 1)
        elif price and actual:
            price_per_100g = round(price / actual * 100, 1)
        elif price and declared:
            price_per_100g = round(price / declared * 100, 1)

        weight_ratio = None
        if actual and declared and declared > 0:
            weight_ratio = round(actual / declared, 3)

        place = {
            "id": 0,
            "name": name,
            "date": (row.get("Дата") or "").strip() or None,
            "menu": (row.get("Меню") or "").strip() or None,
            "type": (row.get("Тип закладу") or "").strip() or None,
            "category": (row.get("Категорія") or "").strip() or None,
            "recommend": (row.get("Рекомендую") or "").strip() or None,
            "order": (row.get("Замовлення") or "").strip() or None,
            "price": clean(price),
            "priceDiscount": clean(price_discount),
            "declaredWeight": clean(declared),
            "actualWeight": clean(actual),
            "rollWeight": clean(roll_weight),
            "ricePct": clean(rice_pct),
            "salmonPct": clean(salmon_pct),
            "creamPct": clean(cream_pct),
            "cucumberPct": clean(cucumber_pct),
            "salmonG": clean(salmon_g),
            "pricePer100g": clean(price_per_100g),
            "weightRatio": weight_ratio,
            "scores": {
                "rice": clean(rice),
                "seasoning": clean(seasoning),
                "salmon": clean(salmon_q),
                "cream": clean(cream),
                "cucumber": clean(cucumber),
                "balance": clean(balance),
                "taste": clean(taste),
                "addons": clean(addons),
                "b_honesty": b_honesty,
                "b_salmon": b_salmon,
                "packaging": clean(packaging),
                "orderConvenience": clean(order_conv),
                "service": clean(service),
                "wait": clean(wait),
            },
            "categories": {k: clean(v) for k, v in cats.items()},
            "waitTime": (row.get("Час очікування") or "").strip() or None,
            "pros": (row.get("Плюси") or "").strip() or None,
            "cons": (row.get("Мінуси") or "").strip() or None,
            "score": total,
            "incomplete": incomplete,
            "deliveryMin": delivery_str(row.get("Мін. сума замовлення")),
            "deliveryFee": delivery_str(row.get("Доставка (Ціна)")),
            "deliveryFreeFrom": delivery_str(row.get("Безкоштовно від")),
            "deliveryNote": (row.get("Примітка") or "").strip() or None,
        }
        places.append(place)

    places.sort(key=lambda p: (p["score"] is not None, p["score"] or 0), reverse=True)
    for i, p in enumerate(places, 1):
        p["id"] = i
    return places


def main():
    print("Fetching CSV...")
    rows = fetch_csv(CSV_URL)
    print(f"Rows: {len(rows)}")

    places = convert(rows)
    print(f"Places: {len(places)}")
    print(f"With score: {sum(1 for p in places if p['score'] is not None)}")
    print(f"Incomplete: {sum(1 for p in places if p.get('incomplete'))}")
    print(f"With delivery fee: {sum(1 for p in places if p.get('deliveryFee'))}")

    if places:
        top = places[0]
        print(f"Top: {top['score']}  {top['name']}  fee={top.get('deliveryFee')}")

    OUT_PATH.write_text(
        json.dumps(places, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Wrote {OUT_PATH} ({OUT_PATH.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
