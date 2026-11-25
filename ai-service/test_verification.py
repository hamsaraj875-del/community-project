"""
Test script for CivicVision AI Image Verification Microservice.
Tests:
1. Pothole category with genuine pothole photo -> Expect: matched
2. Pothole category with clear road photo -> Expect: mismatch_detected
3. Pothole category with car photo -> Expect: mismatch_detected
4. Pothole category with book photo -> Expect: mismatch_detected
5. Garbage category with garbage pile photo -> Expect: matched
6. Broken Streetlight category with damaged streetlight photo -> Expect: matched
7. Broken Streetlight category with pothole photo -> Expect: mismatch_detected
"""
import requests
import io
from PIL import Image, ImageDraw

BASE_URL = "http://127.0.0.1:8000"

def download_image(url):
    resp = requests.get(url, timeout=10)
    resp.raise_for_status()
    return resp.content

def create_synthetic_book_image():
    img = Image.new("RGB", (400, 300), color=(245, 245, 240))
    d = ImageDraw.Draw(img)
    d.rectangle([50, 40, 350, 260], outline=(100, 100, 100), width=3)
    d.text((80, 80), "CHAPTER 1: Introduction to History", fill=(20, 20, 20))
    d.text((80, 120), "This is an open book with printed text...", fill=(50, 50, 50))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()

TEST_CASES = [
    {
        "name": "1. Pothole category + Real Pothole photo",
        "category": "Roads & Infrastructure",
        "title": "Severe Pothole Near Indiranagar",
        "url": "https://res.cloudinary.com/dbaqcimmp/image/upload/v1795515144/civicvision/matching_complaints/real_pothole_crater.jpg",
        "expected": "matched",
    },
    {
        "name": "2. Pothole category + Clear Smooth Road photo",
        "category": "Roads & Infrastructure",
        "title": "Severe Pothole on Highway",
        "url": "https://images.unsplash.com/photo-1519817650390-64a93db51149?w=800&q=80",
        "expected": "mismatch_detected",
    },
    {
        "name": "3. Pothole category + Car photo",
        "category": "Roads & Infrastructure",
        "title": "Large Pothole on Main Road",
        "url": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80",
        "expected": "mismatch_detected",
    },
    {
        "name": "4. Pothole category + Book photo",
        "category": "Roads & Infrastructure",
        "title": "Deep Pothole at Junction",
        "synthetic": "book",
        "expected": "mismatch_detected",
    },
    {
        "name": "5. Garbage category + Overflowing Dumpster photo",
        "category": "Garbage & Sanitation",
        "title": "Massive Overflowing BBMP Garbage Dumpster",
        "url": "https://res.cloudinary.com/dbaqcimmp/image/upload/v1795515157/civicvision/matching_complaints/real_overflowing_garbage_dumpster.jpg",
        "expected": "matched",
    },
    {
        "name": "6. Street Lights category + Flickering Street Lamp photo",
        "category": "Street Lights",
        "title": "Flickering and Dim Street Lamp",
        "url": "https://res.cloudinary.com/dbaqcimmp/image/upload/v1795515162/civicvision/matching_complaints/real_flickering_street_lamp_mist.jpg",
        "expected": "matched",
    },
    {
        "name": "7. Street Lights category + Pothole photo",
        "category": "Street Lights",
        "title": "Street Light Not Working",
        "url": "https://res.cloudinary.com/dbaqcimmp/image/upload/v1795515144/civicvision/matching_complaints/real_pothole_crater.jpg",
        "expected": "mismatch_detected",
    },
]

def run_tests():
    print("=" * 70)
    print("🚀 Running CivicVision AI Verification Test Suite")
    print("=" * 70)

    passed = 0
    total = len(TEST_CASES)

    for tc in TEST_CASES:
        print(f"\n▶ Testing: {tc['name']}")
        print(f"  Category: {tc['category']} | Title: {tc['title']}")

        try:
            if tc.get("synthetic") == "book":
                img_bytes = create_synthetic_book_image()
            else:
                img_bytes = download_image(tc["url"])

            files = {"image": ("test.jpg", img_bytes, "image/jpeg")}
            data = {"category": tc["category"], "title": tc["title"]}

            resp = requests.post(f"{BASE_URL}/verify", data=data, files=files, timeout=20)
            res = resp.json()

            status = res.get("status")
            score = res.get("match_score")
            reason = res.get("reason")

            print(f"  Result: status={status} (score={score})")
            print(f"  Reason: {reason}")

            if status == tc["expected"]:
                print(f"  ✅ PASS (Expected: {tc['expected']})")
                passed += 1
            else:
                print(f"  ⚠️  DIFF (Got: {status}, Expected: {tc['expected']})")

        except Exception as e:
            print(f"  ❌ ERROR: {e}")

    print("\n" + "=" * 70)
    print(f"Test Summary: {passed}/{total} Passed")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
