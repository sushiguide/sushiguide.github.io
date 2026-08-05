#!/usr/bin/env python3
"""
Convert published Google Sheets CSV → data.json for Sushi Guide.
v2.0 scoring rules + partial scores + incomplete flag.
"""

import csv
import json
import sys
import urllib.request
from pathlib import Path

CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSZjm-0R6UpsrGm9IYop8q5yykjy8V6QdL_-rKmkxE6LJsEK5gT6JcWUKVrtA3RntdClDWbuW4hqgSy/pub?gid=0&single=true&output=csv"
OUT_PATH = Path("data.json")


def parse_num(val):
    if val is None:
        return None
    s = str(val).strip().replace(" ", "").replace("\xa0", "")
    if s in ("", "N/A", "#DIV/0!", "#REF!", "#VALUE!", "-", "—"):
        return None
    s = s.replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return None


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


def fetch_csv(url: str) -> list:
    with urllib.request.urlopen(url, timeout=30) as resp:
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
        rice_pct = parse_num(row.get("% Рису"))
        salmon_pct = parse_num(row.get("% Лосося"))
        cream_pct = parse_num(row.get("% Крем-сиру"))
        cucumber_pct = parse_num(row.get("% Огірка"))

        if roll_weight and salmon_pct is not None:
            salmon_g = round(roll_weight * salmon_pct / 100, 1)
        else:
            salmon_g = None

        rice = parse_num(row.get("Рис (1-6)"))
        seasoning = parse_num(row.get("Заправка  (1-4)"))  # note double space
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
        a_taste = round(sum(x for x in a_parts if x is not None), 1) if any(x is not None for x in a_parts) else None

        if b_honesty is not None and b_salmon is not None:
            b_value = b_honesty + b_salmon
        elif b_honesty is not None:
            b_value = b_honesty
        elif b_salmon is not None:
            b_value = b_salmon
        else:
            b_value = None

        c_completeness = addons
        d_service = None
        if wait is not None and service is not None and order_conv is not None:
            d_service = wait + service + order_conv
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
        total = round(sum(available), 1) if available else None

        price_per_100g = None
        if price and actual:
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
            "price": price,
            "priceDiscount": price_discount,
            "declaredWeight": declared,
            "actualWeight": actual,
            "rollWeight": roll_weight,
            "ricePct": rice_pct,
            "salmonPct": salmon_pct,
            "creamPct": cream_pct,
            "cucumberPct": cucumber_pct,
            "salmonG": salmon_g,
            "pricePer100g": price_per_100g,
            "weightRatio": weight_ratio,
            "scores": {
                "rice": rice,
                "seasoning": seasoning,
                "salmon": salmon_q,
                "cream": cream,
                "cucumber": cucumber,
                "balance": balance,
                "taste": taste,
                "addons": addons,
                "b_honesty": b_honesty,
                "b_salmon": b_salmon,
                "packaging": packaging,
                "orderConvenience": order_conv,
                "service": service,
                "wait": wait,
            },
            "categories": cats,
            "waitTime": (row.get("Час очікування") or "").strip() or None,
            "pros": (row.get("Плюси") or "").strip() or None,
            "cons": (row.get("Мінуси") or "").strip() or None,
            "score": total,
            "incomplete": incomplete,
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

    if places:
        top = places[0]
        print(f"Top: {top['score']}  {top['name']}")

    OUT_PATH.write_text(
        json.dumps(places, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Wrote {OUT_PATH}")


if __name__ == "__main__":
    main()
