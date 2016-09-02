dev:
	@make dev-build & \
		./node_modules/.bin/live-server \
		--no-browser \
		--port=3000 \
		--wait=200 \
		--watch=dist/webly.js

dev-build:
	@./node_modules/.bin/watchify \
		--plugin [ css-modulesify -o dist/webly.css ] \
		--verbose \
		--standalone WeblySoccer \
		--debug \
		--entry index.js \
		--outfile dist/webly.js

install: package.json
	@npm install

todo:
	@grep -A 1 --color=always -nd recurse TODO lib src index.js

test:
	@./node_modules/.bin/live-server \
		--open=test \
		--wait=100 \
		--watch=lib,src,test

.PHONY: dev dev-build todo test
