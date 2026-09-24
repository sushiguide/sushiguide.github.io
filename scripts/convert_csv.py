#!/usr/bin/env python3
"""Convert Google Sheets CSV to public data.json. Only final score + consumer fields."""

import csv
import json
import os
import re
import urllib.request
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

CSV_URL = os.environ.get("SUSHIGUIDE_CSV_URL") or (
    "https://docs.google.com/spreadsheets/d/e/"
    "2PACX-1vSZjm-0R6UpsrGm9IYop8q5yykjy8V6QdL_-rKmkxE6LJsEK5gT6JcWUKVrtA3RntdClDWbuW4hqgSy/"
    "pub?gid=0&single=true&output=csv"
)
OUT_PATH = Path("data.json")

# Manual status until the sheet has a filled «Статус» column.
# Values: "closed" | "temporary"
STATUS_OVERRIDES = {
    # "Назва закладу": "closed",
}


def parse_num(val):
    if val is None:
        return None
    s = str(val).strip().replace(" ", "").replace("\xa0", "")
    if s in ("", "N/A", "n/a", "#DIV/0!", "#REF!", "#VALUE!", "-", "\u2014", "\u2013"):
        return None
    s = s.replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return None


def delivery_str(val):
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


def parse_status(row):
    raw = row.get("Статус") or row.get("Стан") or row.get("Status") or ""
    s = str(raw).strip().lower()
    if s in ("закритий", "закрито", "closed", "не працює"):
        return "closed"
    if s in (
        "тимчасово закритий",
        "тимчасово закрито",
        "тимчасово",
        "temporary",
        "temp",
        "pause",
        "на паузі",
    ):
        return "temporary"
    return "open"


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
        salmon_pct = pct_norm(parse_num(row.get("% Лосося")))

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
        service = parse_num(row.get("Обслуговування (1-5)"))
        if service is None:
            service = parse_num(row.get("Обслуговування (Оцінка)"))
        wait = parse_num(row.get("Час очікування (0-5)"))

        b_honesty = honesty_score(actual, declared)
        b_salmon = salmon_qty_score(salmon_pct)

        a_parts = [rice, seasoning, salmon_q, cream, cucumber, balance, taste]
        a_vals = [x for x in a_parts if x is not None]
        a_taste = round(sum(a_vals), 1) if a_vals else None

        b_vals = [x for x in (b_honesty, b_salmon) if x is not None]
        b_value = sum(b_vals) if b_vals else None

        cats = {
            "A_taste": a_taste,
            "B_value": b_value,
            "C_completeness": addons,
            "D_service": sum(x for x in (wait, service, order_conv) if x is not None) if any(x is not None for x in (wait, service, order_conv)) else None,
            "E_delivery": packaging,
        }
        available = [v for v in cats.values() if v is not None]
        incomplete = any(v is None for v in cats.values())
        total = int(round(sum(available))) if available else None

        place = {
            "id": 0,
            "name": name,
            "menu": (row.get("Меню") or "").strip() or None,
            "type": (row.get("Тип закладу") or "").strip() or None,
            "category": (row.get("Категорія") or "").strip() or None,
            "recommend": (row.get("Рекомендую") or "").strip() or None,
            "price": clean(price),
            "priceDiscount": clean(price_discount),
            "categories": {k: clean(v) for k, v in cats.items()},
            "score": total,
            "incomplete": incomplete,
            "status": STATUS_OVERRIDES.get(name) or parse_status(row),
            "deliveryMin": delivery_str(row.get("Мін. сума замовлення")),
            "deliveryFee": delivery_str(row.get("Доставка (Ціна)")),
            "deliveryFreeFrom": delivery_str(row.get("Безкоштовно від")),
            "deliveryNote": (row.get("Примітка") or "").strip() or None,
            "stability": (row.get("Стабільність") or "").strip() or None,
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
    print(f"Status: {dict(Counter(p.get('status') or 'open' for p in places))}")

    if places:
        top = places[0]
        print(f"Top: {top['score']}  {top['name']}  fee={top.get('deliveryFee')}")

    last_updated = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    prev_updated = None
    data_changed = True
    if OUT_PATH.exists():
        try:
            prev = json.loads(OUT_PATH.read_text(encoding="utf-8"))
            if isinstance(prev, dict):
                prev_places = prev.get("places")
                prev_updated = prev.get("lastUpdated")
            elif isinstance(prev, list):
                prev_places = prev
            else:
                prev_places = None
            if prev_places is not None:
                new_norm = json.dumps(places, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
                old_norm = json.dumps(prev_places, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
                if new_norm == old_norm:
                    data_changed = False
                    last_updated = prev_updated or last_updated
        except Exception as e:
            print(f"Could not compare with existing data.json: {e}")

    payload = {"lastUpdated": last_updated, "places": places}
    OUT_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    status = "CHANGED" if data_changed else "unchanged (date kept)"
    print(f"Wrote {OUT_PATH} ({OUT_PATH.stat().st_size} bytes), lastUpdated={last_updated}, data={status}")


if __name__ == "__main__":
    main()
