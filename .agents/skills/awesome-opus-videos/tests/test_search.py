import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import unittest

ROOT=Path(__file__).resolve().parents[1]
SCRIPT=ROOT/'scripts/search.py'
spec=importlib.util.spec_from_file_location('opus_reference_search',SCRIPT)
search=importlib.util.module_from_spec(spec);spec.loader.exec_module(search)
ROWS=json.loads((ROOT/'references/videos.json').read_text())

def cli(*args):
    return subprocess.run([sys.executable,'-I',str(SCRIPT),*args],cwd='/tmp',capture_output=True,text=True)

class ReferenceSearchTests(unittest.TestCase):
    def test_catalog_matches_pinned_source(self):
        lock=json.loads((ROOT/'references/SOURCE.json').read_text())
        self.assertEqual(hashlib.sha256((ROOT/'references/videos.json').read_bytes()).hexdigest(),lock['catalog_sha256'])
        self.assertEqual(len(ROWS),513)
        self.assertEqual(len({row['slug'] for row in ROWS}),513)

    def test_superintelligence_finds_actual_shared_prompt(self):
        result=cli('superintelligence','--json')
        self.assertEqual(result.returncode,0,result.stderr)
        hits=json.loads(result.stdout)['results']
        self.assertEqual([x['slug'] for x in hits],['advait-jayant-712107'])
        self.assertIn('superintelligence should belong to everyone',hits[0]['prompt'])
        self.assertEqual(hits[0]['post_url'],'https://x.com/advait_jayant/status/2103565104243712107')

    def test_partial_prompt_keeps_its_status(self):
        result=cli('--slug','humzaakhalid-537875','--json')
        self.assertEqual(result.returncode,0,result.stderr)
        self.assertEqual(json.loads(result.stdout)['results'][0]['prompt_availability'],'partial')

    def test_category_and_multiple_tags_intersect(self):
        hits=search.search(ROWS,category='motion',tags=['canvas','svg'],limit=7)
        self.assertEqual(len(hits),7)
        for row in hits:
            self.assertEqual(row['category'],'motion')
            self.assertTrue({'canvas','svg'}.issubset(row['tech_tags']))

    def test_word_boundaries_prevent_false_style_matches(self):
        row={'slug':'example','author':'example','category':'motion','tech_tags':['canvas'],'post_url':'https://example.com','prompt':'think about painting a rainy brain'}
        self.assertEqual(search.search([row],'ink ai'),[])
        row['prompt']='draw with ink and AI'
        self.assertEqual(len(search.search([row],'ink ai')),1)

    def test_unavailable_prompt_is_not_called_full(self):
        row={'slug':'example','author':'example','category':'motion','tech_tags':['canvas'],'post_url':'https://example.com','prompt':None}
        self.assertEqual(search.search([row])[0]['prompt_availability'],'unavailable')

    def test_unknown_slug_has_clear_diagnostic(self):
        result=cli('--slug','not-a-reference','--json')
        self.assertEqual(result.returncode,2)
        self.assertIn('No entry has that slug',result.stderr)

    def test_offline_cli_is_repeatable_outside_project(self):
        first=cli('neural typography cinematic','--category','motion','--limit','3','--json')
        second=cli('neural typography cinematic','--category','motion','--limit','3','--json')
        self.assertEqual(first.returncode,0,first.stderr)
        self.assertEqual(first.stdout,second.stdout)
        self.assertGreater(json.loads(first.stdout)['count'],0)

if __name__=='__main__':unittest.main(verbosity=2)
