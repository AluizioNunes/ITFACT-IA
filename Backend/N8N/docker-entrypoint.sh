#!/bin/sh

if [ ! -f /home/node/.n8n/workflow_initialized ]; then
  n8n import:workflow --input=/templates/Template\ Negócio\ com\ Agentes\ de\ IA\ V8.json
  touch /home/node/.n8n/workflow_initialized
fi

n8n start