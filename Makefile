PATH := $(CURDIR)/venv/bin:$(PATH)


.PHONY: clean watch

venv:
	python3 -m venv venv
	pip install -r requirements.txt -r requirements-dev.txt


watch: venv
	jlpm run watch&
	jupyter lab --debug \
		--autoreload \
		--config=jupyter-config/jupyterlab_multicontents_templates.json \
		--no-browser


build: venv
	jlpm run build
	jlpm run install:extension
	jupyter lab build

clean:
	jlpm run clean:all || echo 'not cleaning jlpm'
	rm -rf venv/
