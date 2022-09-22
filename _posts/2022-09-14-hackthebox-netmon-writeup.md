---
layout      : post
title       : "Netmon - HackTheBox"
author      : elc4br4
image       : assets/images/HTB/Netmon-HackTheBox/Netmon.webp
category    : [ htb ]
tags        : [ Windows ]
---

Hoy vamos a resolver una máquina Windows de nivel Easy de la plataforma HackTheBox en la que obtendremos la flag user de manera muy sencilla y aprovecharemos una vulnerabilidad del servidor web para obtener la flag root sin necesidad de escalar privilegios ni acceder al sistema.

![](/assets/images/HTB/Netmon-HackTheBox/rating-netmon.png)

[![HTBadge](https://www.hackthebox.eu/badge/image/533771)](https://www.hackthebox.com/home/users/profile/533771)

# Reconocimiento de puertos

Realizamos el primer escaneo de puertos simple.

```bash
PORT      STATE SERVICE
21/tcp    open  ftp
80/tcp    open  http
135/tcp   open  msrpc
139/tcp   open  netbios-ssn
445/tcp   open  microsoft-ds
5985/tcp  open  wsman
47001/tcp open  winrm
49664/tcp open  unknown
49665/tcp open  unknown
49666/tcp open  unknown
49667/tcp open  unknown
49668/tcp open  unknown
49669/tcp open  unknown
```

Copiamos todos los puertos a través de la funcion extractPorts de S4vitar.

```bash
File: extractPorts.tmp
──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
    
    [*] Extracting information...

    [*] IP Address: 10.10.10.152
    [*] Open ports: 21,80,135,139,445,5985,47001,49664,49665,49666,49667,49668,49669

    [*] Ports copied to clipboard
```


Como siempre os dejo una captura de pantalla con la función que debéis añadir al archivo de configuración de vuestra shell.


![](/assets/images/HTB/Netmon-HackTheBox/extractports.png)



Ahora realizo un escaneo más detallado de servicios y versiones y como siempre sacaremos la información más relevante.

```bash
PORT      STATE SERVICE      VERSION
21/tcp    open  ftp          Microsoft ftpd
| ftp-syst: 
|_  SYST: Windows_NT
| ftp-anon: Anonymous FTP login allowed (FTP code 230)
| 02-03-19  12:18AM                 1024 .rnd
| 02-25-19  10:15PM       <DIR>          inetpub
| 07-16-16  09:18AM       <DIR>          PerfLogs
| 02-25-19  10:56PM       <DIR>          Program Files
| 02-03-19  12:28AM       <DIR>          Program Files (x86)
| 02-03-19  08:08AM       <DIR>          Users
|_02-25-19  11:49PM       <DIR>          Windows
80/tcp    open  http         Indy httpd 18.1.37.13946 (Paessler PRTG bandwidth monitor)
|_http-trane-info: Problem with XML parsing of /evox/about
|_http-server-header: PRTG/18.1.37.13946
| http-title: Welcome | PRTG Network Monitor (NETMON)
|_Requested resource was /index.htm
135/tcp   open  msrpc        Microsoft Windows RPC
139/tcp   open  netbios-ssn  Microsoft Windows netbios-ssn
445/tcp   open  microsoft-ds Microsoft Windows Server 2008 R2 - 2012 microsoft-ds
5985/tcp  open  http         Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
47001/tcp open  http         Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
49664/tcp open  msrpc        Microsoft Windows RPC
49665/tcp open  msrpc        Microsoft Windows RPC
49666/tcp open  msrpc        Microsoft Windows RPC
49667/tcp open  msrpc        Microsoft Windows RPC
49668/tcp open  msrpc        Microsoft Windows RPC
49669/tcp open  msrpc        Microsoft Windows RPC
Service Info: OSs: Windows, Windows Server 2008 R2 - 2012; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-time: 
|   date: 2022-09-13T10:10:22
|_  start_date: 2022-09-13T10:00:25
|_clock-skew: mean: -2s, deviation: 0s, median: -3s
| smb-security-mode: 
|   account_used: guest
|   authentication_level: user
|   challenge_response: supported
|_  message_signing: disabled (dangerous, but default)
| smb2-security-mode: 
|   3.1.1: 
|_    Message signing enabled but not required
```

Extraigo la información relevante:

| Puerto | Servicio | Versión |
| ------ | -------- | ------- |
| 21     | FTP      | Microsoft ftpd |
| 80     | HTTP     | Indy httpd 18.1.37.13946 |
| 445    | Microsoft ds | Microsoft Windows Server 2008 R2 |
| 47001  | HTTP | Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP) |

* Tenemos acceso anónimo al servidor FTP.


#FTP

```ftp
❯ ftp 10.10.10.152
Connected to 10.10.10.152.
220 Microsoft FTP Service
Name (10.10.10.152:elc4br4): anonymous
331 Anonymous access allowed, send identity (e-mail name) as password.
Password:
230 User logged in.
Remote system type is Windows_NT.
ftp> ls
200 PORT command successful.
125 Data connection already open; Transfer starting.
02-03-19  12:18AM                 1024 .rnd
02-25-19  10:15PM       <DIR>          inetpub
07-16-16  09:18AM       <DIR>          PerfLogs
02-25-19  10:56PM       <DIR>          Program Files
02-03-19  12:28AM       <DIR>          Program Files (x86)
02-03-19  08:08AM       <DIR>          Users
02-25-19  11:49PM       <DIR>          Windows
226 Transfer complete.
ftp> cd Users
250 CWD command successful.

ftp> ls
200 PORT command successful.
c125 Data connection already open; Transfer starting.
02-25-19  11:44PM       <DIR>          Administrator
02-03-19  12:35AM       <DIR>          Public
226 Transfer complete.
ftp> cd Public
250 CWD command successful.

ftp> ls
200 PORT command successful.
125 Data connection already open; Transfer starting.
02-03-19  08:05AM       <DIR>          Documents
07-16-16  09:18AM       <DIR>          Downloads
07-16-16  09:18AM       <DIR>          Music
07-16-16  09:18AM       <DIR>          Pictures
09-13-22  06:01AM                   34 user.txt
07-16-16  09:18AM       <DIR>          Videos
226 Transfer complete.

ftp> get user.txt
local: user.txt remote: user.txt
200 PORT command successful.
125 Data connection already open; Transfer starting.
226 Transfer complete.
34 bytes received in 0.27 secs (0.1213 kB/s)
```
He podido obtener el archivo user.txt... mmm algo fácil no? Eso me quiere decir que obtener el root va a ser un proceso largo y complejo.


Ahora toca obtener el root.txt 

De primeras me dispongo a observar los servidores web.

![](/assets/images/HTB/Netmon-HackTheBox/web1.png)

Hay un servidor web bajo el título de PRTG Network Monitor (NETMON).

El servidor muestra un login pero no disponemos de credenciales.

Antes de nada abro el servidor FTP de nuevo en busca de la ruta donde se ubica el propio servidor.

![](/assets/images/HTB/Netmon-HackTheBox/ftp1.png)

Encuentro la ruta del servidor web y me dispongo a buscar archivos con credenciales o datos que puedan ayudarme a continuar.
 
Hay varios con extensión .dat y .old que descargo a mi máquina local para analizar.

Encuentro unas credenciales en el archivo "PRTG Configuration.old.bak"

![](/assets/images/HTB/Netmon-HackTheBox/db.png)

Podríamos usar las credenciales para loguearnos en el servidor web.

Pero no tenemos suerte.

![](/assets/images/HTB/Netmon-HackTheBox/web2.png)

Pero si nos fijamos, el usuario coincide con el nombre del panel... Deberían ser las credenciales correctas...

Recordemos que el archivo de donde hemos extraido las credenciales posee la extensión .old.bak

La extensión .bak proviene de Backup, por lo  tanto es una copia del archivo original "PRTG Configuration.old" y si nos fijamos la contraseña acaba en 2018, ¿y si probamos a cambiarla por 2019 o 2020?

Listo, hemos podido iniciar sesión!!

![](/assets/images/HTB/Netmon-HackTheBox/web3.png)

 
Una vez dentro me dispongo a buscar la versión del servicio PRTG --> PRTG Version "PRTG Network Monitor 18.1.37.13946"

Asique ya que tenemos credenciales busco alguna vulnerabilidad para explotar.

```bash
❯ searchsploit PRTG
-------------------------------------------------------- ---------------------------------
 Exploit Title                                          |  Path
-------------------------------------------------------- ---------------------------------
PRTG Network Monitor 18.2.38 - (Authenticated) Remote C | windows/webapps/46527.sh
PRTG Network Monitor 20.4.63.1412 - 'maps' Stored XSS   | windows/webapps/49156.txt
PRTG Network Monitor < 18.1.39.1648 - Stack Overflow (D | windows_x86/dos/44500.py
PRTG Traffic Grapher 6.2.1 - 'url' Cross-Site Scripting | java/webapps/34108.txt
-------------------------------------------------------- ---------------------------------
```

Tenemos varios, utilizé uno de ellos pero me daba errores asique encontré un post donde explicaba como hacerlo de forma manual.

[https://codewatch.org/blog/?p=453](https://codewatch.org/blog/?p=453)

Seguimos estos pasos:

1. Nos dirigimos al panel de la web y vamos a Account > Notificaciones > Y añadimos una nueva notificación.

2. Nos desplazamos hacia abajo y hacemos click en la opción Execute Program y en Program File seleccionamos la opción con extensión .bat

3. En el parámetro escribiremos lo siguiente --> `elc4br4.txt; Copy-Item 'C:\Users\Administrator\Desktop\root.txt' -Destination 'C:\Users\Public\elc4br4.txt' -Recurse `

![](/assets/images/HTB/Netmon-HackTheBox/web4.png)

Ahora accedemos al servidor ftp y podremos leer la bandera root.

![](/assets/images/HTB/Netmon-HackTheBox/ftp2.png)


En este caso hemos podido obtener la bandera sin acceder al sistema ni escalar privilegios, pero sería posible hacerlo subiendo el archivo ncx64.exe (netcat) al ftp y ejecutando una conexión inversa a través del mismo desde el panel web como hemos hecho para leer el archivo root.



