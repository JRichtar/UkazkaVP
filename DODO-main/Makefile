.PHONY: clean dev build setup assets serve

dev: assets
	npx browserify --debug src/main.ts -p [ tsify --noImplicitAny ] > dist/bundle.js

serve: dev
	cd dist; python3 -m http.server

build: assets
	npm install
	npx browserify src/main.ts -p [ tsify --noImplicitAny ] | npx uglifyjs > dist/bundle.js

setup:
	npm install

clean:
	rm -rf dist

assets: clean
	mkdir dist

	cp -r css/ dist/css/

	mkdir dist/css/modules
	find node_modules -name \*.css -exec cp {} dist/css/modules/ \;
	find node_modules -name \*.css.map -exec cp {} dist/css/modules/ \;
	
	cp -r assets/ dist/assets/
	cp *.html dist/
	cp *.js dist/
