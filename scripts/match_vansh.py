import json

with open('public/data/opportunities.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

items = data.get('opportunities', [])
print(f'Total opportunities: {len(items)}')

matches = []
for it in items:
    title = str(it.get('title') or '')
    org = str(it.get('organization') or '')
    desc = str(it.get('description') or '')
    loc = str(it.get('location') or '')
    tags = " ".join(it.get('tags') or [])
    full = f"{title} {org} {desc} {tags} {loc}".lower()

    score = 0
    reasons = []

    # Check for scholarships, fellowships, apprenticeships
    opp_type = it.get('type')
    if opp_type == 'scholarship':
        score += 8
        reasons.append('Scholarship Award')
    elif opp_type == 'fellowship':
        score += 8
        reasons.append('Fellowship Opportunity')
    elif opp_type == 'apprenticeship':
        score += 6
        reasons.append('Apprenticeship / Traineeship')

    # BBA / Business / Operations / Management
    if any(k in full for k in ['business', 'product manager', 'associate product', 'operations', 'project management', 'program manager', 'management consultant', 'analyst', 'strategy', 'marketing', 'growth']):
        score += 5
        reasons.append('Business & Product Management')

    # Social Impact / Community / NGO / Leadership / Youth
    if any(k in full for k in ['social impact', 'ngo', 'nonprofit', 'community', 'volunteer', 'youth', 'leadership', 'education', 'edtech', 'civic']):
        score += 5
        reasons.append('Community Leadership & Impact')

    # India or Remote
    if 'india' in full:
        score += 4
        reasons.append('India Native')
    elif it.get('remote'):
        score += 3
        reasons.append('Remote Friendly')

    # Content / Publishing / Design / Creative
    if any(k in full for k in ['content', 'editorial', 'publishing', 'writing', 'communications', 'design', 'canva']):
        score += 3
        reasons.append('Publishing & Creative')

    if score >= 5:
        matches.append({
            'score': score,
            'reasons': reasons,
            'item': it
        })

matches.sort(key=lambda x: x['score'], reverse=True)
print(f"Total matching opportunities for Vansh: {len(matches)}")

by_type = {'scholarship': [], 'fellowship': [], 'apprenticeship': [], 'internship': []}
for m in matches:
    t = m['item'].get('type')
    if t in by_type:
        by_type[t].append(m)

print(f"Breakdown: Scholarships={len(by_type['scholarship'])}, Fellowships={len(by_type['fellowship'])}, Apprenticeships={len(by_type['apprenticeship'])}, Internships={len(by_type['internship'])}")

print("\n--- TOP SCHOLARSHIPS ---")
for m in by_type['scholarship'][:8]:
    it = m['item']
    print(f"- {it['title']} ({it['organization']}) | Score: {m['score']} | {m['reasons']}")

print("\n--- TOP FELLOWSHIPS ---")
for m in by_type['fellowship'][:8]:
    it = m['item']
    print(f"- {it['title']} ({it['organization']}) | Score: {m['score']} | {m['reasons']}")

print("\n--- TOP APPRENTICESHIPS ---")
for m in by_type['apprenticeship'][:8]:
    it = m['item']
    print(f"- {it['title']} ({it['organization']}) | Score: {m['score']} | {m['reasons']}")

print("\n--- TOP INTERNSHIPS (Product / Business / Operations) ---")
for m in by_type['internship'][:10]:
    it = m['item']
    print(f"- {it['title']} ({it['organization']}) | Score: {m['score']} | {m['reasons']}")
