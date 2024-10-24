PATH := $(CURDIR)/venv/bin:$(PATH)
.PHONY: venv watch build build-local clean

venv:
	python3 -m venv venv
	venv/bin/pip install -r requirements.txt -r requirements-dev.txt


watch: venv
	venv/bin/jlpm run watch&
	venv/bin/jupyter lab --debug \
		--autoreload \
		--config=examples/jupyter_config.py \
		--no-browser


build: venv
	venv/bin/jlpm run build
	venv/bin/jlpm run install:extension
	venv/bin/jupyter lab build

build-local:
	pip install --trusted-host pypi.org --trusted-host files.pythonhosted.org --force-reinstall -r requirements.txt
	python setup.py bdist_wheel

clean:
	venv/bin/jlpm run clean:all || echo 'not cleaning jlpm'
	rm -rf venv node_modules *.egg-info dist/*
