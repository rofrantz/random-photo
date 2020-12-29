#Download base image ubuntu 16.04
FROM ubuntu:16.04
 
# Update Software repository
RUN apt-get update
 
# Install nginx, php-fpm and supervisord from ubuntu repository
RUN apt-get install -y curl nginx supervisor

# Install PHP
RUN apt-get install -y php7.0-fpm php7.0-common php7.0-fpm php7.0-cli php7.0-curl php7.0-xml php7.0-mbstring php7.0-zip
RUN apt-get install -y php-imagick imagemagick

# Install Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Install npm & bower
RUN apt-get install -y npm && \
	npm install -g bower && \
	ln -s /usr/bin/nodejs /usr/bin/node

# Instal exiv2
RUN apt-get install -y exiv2

RUN rm -rf /var/lib/apt/lists/*

#Define the ENV variable
ENV nginx_vhost /etc/nginx/sites-available/default
ENV php_conf /etc/php/7.0/fpm/php.ini
ENV nginx_conf /etc/nginx/nginx.conf
ENV supervisor_conf /etc/supervisor/supervisord.conf
 
# Enable php-fpm on nginx virtualhost configuration
COPY docker/nginx.conf ${nginx_vhost}
RUN sed -i -e 's/;cgi.fix_pathinfo=1/cgi.fix_pathinfo=0/g' ${php_conf} && \
    echo "\ndaemon off;" >> ${nginx_conf}
 
#Copy supervisor configuration
COPY docker/supervisord.conf ${supervisor_conf}

RUN mkdir -p /run/php && \
    chown -R www-data:www-data /var/www/html && \
    chown -R www-data:www-data /run/php
 
# Volume configuration
VOLUME ["/etc/nginx/sites-enabled", "/etc/nginx/certs", "/etc/nginx/conf.d", "/var/log/nginx", "/var/www/html"]
 
# Configure Services and Port
COPY docker/start.sh /start.sh
RUN chmod +x /start.sh
CMD ["./start.sh"]
 
EXPOSE 80