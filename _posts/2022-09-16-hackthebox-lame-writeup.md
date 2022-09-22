---
layout      : post
title       : "Lame - HackTheBox"
author      : elc4br4
image       : assets/images/HTB/Lame-HackTheBox/Lame.webp
category    : [ htb ]
tags        : [ Linux ]
---

Hoy romperemos una máquina Linux de nivel Easy, explotaremos una versión vulnerable del protocolo SMB a través de un módulo de metasploit, y en esta ocasión no tendremos que escalar privilegios, ya que el mismo módulo nos otorga el acceso como root.

![](/assets/images/HTB/Lame-HackTheBox/rating-lame.png)

[![HTBadge](https://www.hackthebox.eu/badge/image/533771)](https://www.hackthebox.com/home/users/profile/533771)

# Reconocimiento de Puertos

```nmap
PORT     STATE SERVICE
21/tcp   open  ftp
22/tcp   open  ssh
139/tcp  open  netbios-ssn
445/tcp  open  microsoft-ds
3632/tcp open  distccd
```

Tenemos varios puertos pero necesitamos más información, asique realizaré el escaneo de servicios y versiones para obtener información más detallada.

Después extraeré la información más relevante.

```nmap
PORT     STATE SERVICE     VERSION
21/tcp   open  ftp         vsftpd 2.3.4
|_ftp-anon: Anonymous FTP login allowed (FTP code 230)
| ftp-syst: 
|   STAT: 
| FTP server status:
|      Connected to 10.10.14.4
|      Logged in as ftp
|      TYPE: ASCII
|      No session bandwidth limit
|      Session timeout in seconds is 300
|      Control connection is plain text
|      Data connections will be plain text
|      vsFTPd 2.3.4 - secure, fast, stable
|_End of status
22/tcp   open  ssh         OpenSSH 4.7p1 Debian 8ubuntu1 (protocol 2.0)
| ssh-hostkey: 
|   1024 60:0f:cf:e1:c0:5f:6a:74:d6:90:24:fa:c4:d5:6c:cd (DSA)
|_  2048 56:56:24:0f:21:1d:de:a7:2b:ae:61:b1:24:3d:e8:f3 (RSA)
139/tcp  open  netbios-ssn Samba smbd 3.X - 4.X (workgroup: WORKGROUP)
445/tcp  open  netbios-ssn Samba smbd 3.0.20-Debian (workgroup: WORKGROUP)
3632/tcp open  distccd     distccd v1 ((GNU) 4.2.4 (Ubuntu 4.2.4-1ubuntu4))
Service Info: OSs: Unix, Linux; CPE: cpe:/o:linux:linux_kernel

Host script results:
|_smb2-time: Protocol negotiation failed (SMB2)
| smb-security-mode: 
|   account_used: <blank>
|   authentication_level: user
|   challenge_response: supported
|_  message_signing: disabled (dangerous, but default)
| smb-os-discovery: 
|   OS: Unix (Samba 3.0.20-Debian)
|   Computer name: lame
|   NetBIOS computer name: 
|   Domain name: hackthebox.gr
|   FQDN: lame.hackthebox.gr
|_  System time: 2022-09-15T12:18:59-04:00
|_clock-skew: mean: 2h00m06s, deviation: 2h49m43s, median: 5s
```

| Puerto | Servicio | Versión |
| ------ | -------- | ------- |
| 21     | FTP      | vsftpd 2.3.4 |
| 22     | SSH      | OpenSSH 4.7p1 Debian 8ubuntu1 |
| 139    | SMB      | Samba smbd 3.X - 4.X |
| 445    | SMB      | Samba smbd 3.0.20-Debian |
| 3632   | distccd  | distccd v1 ((GNU) 4.2.4 |


> Tenemos acceso anónimo al servidor FTP.


# FTP

Accedemos al servidor FTP con las credenciales anonymous:anonymous

Pero no encuentro nada, asique procedo a buscar posibles vulnerabilidades de la versión 2.3.4

![](/assets/images/HTB/Lame-HackTheBox/searchsploit.png)


Tenemos un exploit en python y el otro a través de metasploit, esta vez usaré metasploit.

![](/assets/images/HTB/Lame-HackTheBox/metasploit1.png)


Como se puede ver, no funciona.

Llegados a este punto... a otra cosa mariposa...

# SMB

Tenemos el protocolo SMB y su versión, asique de igual forma que en el ftp, busquemos si es vulnerable.

![](/assets/images/HTB/Lame-HackTheBox/searchsploit2.png)

Tenemos uno de ellos en metasploit, que es el que usaré <br>
`Samba 3.0.20 < 3.0.25rc3 - 'Username' map script' Command Execution (Metasploit) `

Desde el módulo de metasploit, configuramos los parámetros (RHOST,LHOST,LPORT... etc) y lanzamos el exploit.

> Y recibimos la shell como root!!!!

![](/assets/images/HTB/Lame-HackTheBox/metasploit2.png)

Ahora ya podremos leer la flag user y root

Para no andar buscando las flag, uso el siguiente comando.

```bash
find / -name user.txt -type f 2>/dev/null 
find / -name root.txt -type f 2>/dev/null
```

![](/assets/images/HTB/Lame-HackTheBox/hacker.gif)






