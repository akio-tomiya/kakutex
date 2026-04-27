.PHONY: test smoke bundle docs package

test:
	npm test

smoke:
	npm run smoke

bundle:
	python3 tools/build_bundle.py

docs:
	python3 tools/build_docs.py

package:
	python3 tools/package_release.py
