#!/usr/bin/env bash

dir="${PWD##*/}"
adapterName=${dir//"iobroker."/}

if [[ $1 =~ "a" ]]; then
	npm run build
	npm run translate
	iobroker upload $adapterName
else
	npm run build
	iobroker restart $adapterName
fi