.SILENT:
local-build:
	composer update
	bower update

deploy:
	ansible-playbook provisioning/ansible.yml
