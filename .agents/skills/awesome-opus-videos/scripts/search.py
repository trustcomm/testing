#!/usr/bin/env python3
"""Offline, word-aware reference lookup; Python standard library only."""
import argparse
from collections import Counter
import json
import math
from pathlib import Path
import re

CATALOG=Path(__file__).resolve().parents[1]/'references/videos.json'
STOP_WORDS=set('a an and are as at be by create film for from in is it make of on or second seconds style that the this to video videos with you your'.split())
ALIASES={'three.js':'threejs','web audio':'audio','glsl':'shader','watercolour':'watercolor'}

def tokens(text):
    text=text.casefold()
    for old,new in ALIASES.items():text=text.replace(old,new)
    return re.findall(r'[a-z0-9]+',text)

def public_record(row,score):
    return {
        'slug':row['slug'],'author':row['author'],'category':row['category'],
        'tech_tags':row['tech_tags'],'post_url':row['post_url'],
        'reference_url':row.get('skillry_url'),
        'prompt_availability':'unavailable' if not row.get('prompt') else 'partial' if row.get('prompt_partial') else 'full',
        'prompt':row.get('prompt') or '', 'score':round(score,5),
    }

def search(rows,query='',category=None,tags=(),limit=5,slug=None):
    if slug:
        return [public_record(row,0) for row in rows if row['slug']==slug][:1]
    required={ALIASES.get(t.casefold(),t.casefold()) for t in tags}
    filtered=[r for r in rows if (not category or r['category']==category) and required.issubset(set(r['tech_tags']))]
    terms=sorted(set(tokens(query))-STOP_WORDS)
    if not terms:
        return [public_record(r,0) for r in sorted(filtered,key=lambda r:r['slug'])[:limit]]
    docs=[Counter(tokens(' '.join([r['slug'],r['author'],r['category'],*r['tech_tags'],r.get('prompt') or '']))) for r in filtered]
    if not docs:return []
    avg=sum(sum(d.values()) for d in docs)/len(docs)
    frequency={term:sum(term in doc for doc in docs) for term in terms}
    ranked=[]
    for row,doc in zip(filtered,docs):
        length=sum(doc.values());score=0
        for term in terms:
            tf=doc[term]
            if not tf:continue
            idf=math.log(1+(len(docs)-frequency[term]+.5)/(frequency[term]+.5))
            score+=idf*(tf*2.2)/(tf+1.2*(.25+.75*length/max(avg,1)))
        if score>0:ranked.append((score,row))
    ranked.sort(key=lambda item:(-item[0],item[1]['slug']))
    return [public_record(row,score) for score,row in ranked[:limit]]

def positive_limit(value):
    number=int(value)
    if not 1<=number<=50:raise argparse.ArgumentTypeError('limit must be between 1 and 50')
    return number

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('query',nargs='?',default='')
    parser.add_argument('--category',choices=['motion','explainer','3d','interactive'])
    parser.add_argument('--tag',action='append',default=[],help='Repeat to require multiple tags.')
    parser.add_argument('--limit',type=positive_limit,default=5)
    parser.add_argument('--slug',help='Retrieve one exact reference.')
    parser.add_argument('--json',action='store_true')
    args=parser.parse_args()
    rows=json.loads(CATALOG.read_text(encoding='utf-8'))
    hits=search(rows,args.query,args.category,args.tag,args.limit,args.slug)
    if args.slug and not hits:parser.error('No entry has that slug.')
    if args.json:
        print(json.dumps({'query':args.query,'count':len(hits),'results':hits},ensure_ascii=False,indent=2))
        return
    if not hits:
        print('No matching references. Broaden the query or browse a category.')
    for i,row in enumerate(hits,1):
        print(f"{i}. {row['slug']} — @{row['author']} [{row['category']}; {', '.join(row['tech_tags'])}; {row['prompt_availability']} prompt]")
        print('   Original:',row['post_url'])
        print('   Reference:',row['reference_url'])
        print('   Prompt:',row['prompt'])
        print()

if __name__=='__main__':main()
