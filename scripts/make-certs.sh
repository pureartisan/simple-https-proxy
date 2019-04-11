NAME="$1"

cd certs &&\
mkdir -p $NAME &&\
cd $NAME &&\
openssl req -new -newkey rsa:4096 -days 365 -nodes -x509 \
    -subj "/C=US/ST=Denial/L=Springfield/O=Dis/CN=localhost" \
    -keyout local.key -out local.cert