.SILENT:
build:
	composer update
	bower update

deploy:
	rsync -azvhO -e "ssh -i ${HOME}/.ssh/id_rsa" --chown=www-data:www-data --delete --exclude=.git --exclude=.idea ${CURDIR}/ frantz@frantz-htpc:/var/www/rp/