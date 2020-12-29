# Random photo

Displays random photos in a very nice way.

# Docker
docker build -t random_photo_img .
docker run -d -v /share/Web/random-photo/:/var/www/html -v /share/Photos/:/photos -p 8500:80 --name random_photo random_photo_img