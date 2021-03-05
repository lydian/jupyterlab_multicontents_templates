.PHONY: clean watch

venv:
	python3 -m venv venv
	venv/bin/pip install -r requirements.txt -r requirements-dev.txt
	venv/bin/jupyter labextension develop . --overwrite
	PATH=$(CURDIR)/venv/bin:${PATH} venv/bin/jlpm run build


watch: venv
	PATH=$(CURDIR)/venv/bin:${PATH} venv/bin/jlpm run watch&
	venv/bin/jupyter lab


build: venv
	venv/bin/jupyter lab build

clean:
	rm -rf venv/
