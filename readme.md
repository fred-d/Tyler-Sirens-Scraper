# Connecting to the Rethink REPL

_Instructions for Mac only currently_

1. Ensure your public key is on the Tyler Web Dev storage server.

2. Open an SSH SOCKS proxy to the Tyler Web Dev storage server.
Use the domain `rethink.tylerwebdev.io`
```
ssh -D 3000 root@rethink.tylerwebdev.io
```
    
3. In the Mac System Preferences screen, navigate to the Network screen. From here, click on `Advanced...`

4. Click on the `Proxies` tab at the top.

5. Check the box by SOCKS Proxy.

6. Enter `localhost` : `3000` in the Proxy Server configuration box to the right.
Don't check the `Proxy server requires password` box.

7. Click Ok, then click `Apply`

8. Navigate to `localhost:8080` in any browser. You'll now be connected to the
RethinkDB web interface.

9. To stop using the proxy, terminate the running `ssh` command and turn off the Proxy
through the Mac network configuration panel.

You may temporarily lose internet connection while the proxy is establish.
