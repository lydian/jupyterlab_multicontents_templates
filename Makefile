PATH := $(CURDIR)/venv/bin:$(PATH)
.PHONY: clean watch

venv:
	python3 -m venv venv
	venv/bin/pip install -r requirements.txt -r requirements-dev.txt


watch: venv
	venv/bin/jlpm run watch&
	venv/bin/jupyter lab --debug \
		--autoreload \
		--config=jupyter-config/jupyter_config.py \
		--no-browser


build: venv
	venv/bin/jlpm run build
	venv/bin/jlpm run install:extension
	venv/bin/jupyter lab build

clean:
	venv/bin/jlpm run clean:all || echo 'not cleaning jlpm'
	rm -rf venv/
