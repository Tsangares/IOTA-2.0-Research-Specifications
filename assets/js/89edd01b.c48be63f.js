(self.webpackChunkdoc_ops=self.webpackChunkdoc_ops||[]).push([[984],{3905:function(e,t,n){"use strict";n.d(t,{kt:function(){return u}});var i=n(7294);function r(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function a(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);t&&(i=i.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,i)}return n}function l(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?a(Object(n),!0).forEach((function(t){r(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):a(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function o(e,t){if(null==e)return{};var n,i,r=function(e,t){if(null==e)return{};var n,i,r={},a=Object.keys(e);for(i=0;i<a.length;i++)n=a[i],t.indexOf(n)>=0||(r[n]=e[n]);return r}(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(i=0;i<a.length;i++)n=a[i],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(r[n]=e[n])}return r}var s=i.createContext({}),p=function(e){var t=i.useContext(s),n=t;return e&&(n="function"==typeof e?e(t):l(l({},t),e)),n},d={inlineCode:"code",wrapper:function(e){var t=e.children;return i.createElement(i.Fragment,{},t)}},h=i.forwardRef((function(e,t){var n=e.components,r=e.mdxType,a=e.originalType,s=e.parentName,h=o(e,["components","mdxType","originalType","parentName"]),u=p(n),c=r,k=u["".concat(s,".").concat(c)]||u[c]||d[c]||a;return n?i.createElement(k,l(l({ref:t},h),{},{components:n})):i.createElement(k,l({ref:t},h))}));function u(e,t){var n=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var a=n.length,l=new Array(a);l[0]=h;var o={};for(var s in t)hasOwnProperty.call(t,s)&&(o[s]=t[s]);o.originalType=e,o.mdxType="string"==typeof e?e:r,l[1]=o;for(var p=2;p<a;p++)l[p]=n[p];return i.createElement.apply(null,l)}return i.createElement.apply(null,n)}h.displayName="MDXCreateElement"},944:function(e,t,n){"use strict";n.r(t),n.d(t,{frontMatter:function(){return o},contentTitle:function(){return s},metadata:function(){return p},toc:function(){return d},default:function(){return u}});var i=n(2122),r=n(9756),a=(n(7294),n(3905)),l=["components"],o={},s="3.3 Peer Discovery",p={unversionedId:"3.3 Peer Discovery",id:"3.3 Peer Discovery",isDocsHomePage:!1,title:"3.3 Peer Discovery",description:"3.3.1 Introduction",source:"@site/docs/3.3 Peer Discovery.md",sourceDirName:".",slug:"/3.3 Peer Discovery",permalink:"/docs/3.3 Peer Discovery",editUrl:"https://github.com/iotaledger/IOTA-2.0-Research-Specifications/edit/main/docs/3.3 Peer Discovery.md",version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"2.4 Data flow",permalink:"/docs/2.4 Data Flow"},next:{title:"3.4 Neighbor Selection",permalink:"/docs/3.4 Neighbor Selection"}},d=[{value:"3.3.1 Introduction",id:"331-introduction",children:[]},{value:"3.3.2 Detailed design",id:"332-detailed-design",children:[{value:"3.3.2.1 Node identities",id:"3321-node-identities",children:[]},{value:"3.3.2.2 Verification",id:"3322-verification",children:[]},{value:"3.3.2.3 Removal",id:"3323-removal",children:[]},{value:"3.3.2.4 Discovery",id:"3324-discovery",children:[]},{value:"3.3.2.5 Ping and Pong Layout",id:"3325-ping-and-pong-layout",children:[]},{value:"3.3.2.6 Denial of Service",id:"3326-denial-of-service",children:[]}]}],h={toc:d};function u(e){var t=e.components,n=(0,r.Z)(e,l);return(0,a.kt)("wrapper",(0,i.Z)({},h,n,{components:t,mdxType:"MDXLayout"}),(0,a.kt)("h1",{id:"33-peer-discovery"},"3.3 Peer Discovery"),(0,a.kt)("h2",{id:"331-introduction"},"3.3.1 Introduction"),(0,a.kt)("p",null,"This section defines the ",(0,a.kt)("em",{parentName:"p"},"Peer Discovery")," protocol, its logic and the different requests and responses exchanged."),(0,a.kt)("p",null,"In order to establish connections, an IOTA node needs to discover and maintain a list of the reachable IP addresses of other peers. Moreover, some external modules, such as the ",(0,a.kt)("em",{parentName:"p"},"Neighbor Selection")," and the ",(0,a.kt)("em",{parentName:"p"},"Fast Probabilistic Consensus (FPC)")," may require an updated list of known peers."),(0,a.kt)("p",null,"The main goal of the ",(0,a.kt)("em",{parentName:"p"},"Peer Discovery")," protocol is to expose an interface providing a list of all the verified peers."),(0,a.kt)("p",null,"Throughout this section the terms ",(0,a.kt)("inlineCode",{parentName:"p"},"Node")," and ",(0,a.kt)("inlineCode",{parentName:"p"},"Peer")," are used interchangeably to refer to a ",(0,a.kt)("inlineCode",{parentName:"p"},"Node")," device."),(0,a.kt)("p",null,"The usage of the ",(0,a.kt)("em",{parentName:"p"},"Ping")," and ",(0,a.kt)("em",{parentName:"p"},"Pong")," mechanism is to be considered as a bidirectional exchange similarly to how described by other standards such as ",(0,a.kt)("a",{parentName:"p",href:"https://core-wg.github.io/coap-sig/"},"CoAP")," and ",(0,a.kt)("a",{parentName:"p",href:"https://tools.ietf.org/html/rfc6455#section-5.5.2"},"WebSocket"),"."),(0,a.kt)("h2",{id:"332-detailed-design"},"3.3.2 Detailed design"),(0,a.kt)("p",null,"To bootstrap the peer discovery, a node ",(0,a.kt)("em",{parentName:"p"},"must")," be able to reach one or more entry nodes. To achieve this, the implementation of the protocol ",(0,a.kt)("em",{parentName:"p"},"shall")," provide a hard-coded list of trusted ",(0,a.kt)("strong",{parentName:"p"},"entry nodes")," run by the IF or by trusted community members that answer to peer discovery packets coming from new nodes joining the IOTA network. This approach is a common practice of many distributed networks ",(0,a.kt)("a",{parentName:"p",href:"https://ieeexplore.ieee.org/iel7/9739/8649699/08456488.pdf"},"[Neudecker 2018]"),".\nPublic Key-based Cryptography (PKC) ",(0,a.kt)("em",{parentName:"p"},"shall")," be used for uniquely ",(0,a.kt)("a",{parentName:"p",href:"#3321-Node-identities"},"identifying")," peers and for authenticating each packet.\nThe usage of the Ping and Pong protocols is that ",(0,a.kt)("a",{parentName:"p",href:"#Ping"},(0,a.kt)("em",{parentName:"a"},"Ping"))," are sent to verify a given peer and, upon reception of a valid ",(0,a.kt)("a",{parentName:"p",href:"#Pong"},(0,a.kt)("em",{parentName:"a"},"Pong"))," as a response from that peer, the peer is verified.\nOnce a peer has been verified, it can be queried to discover new peers by sending a ",(0,a.kt)("a",{parentName:"p",href:"#DiscoveryRequest"},(0,a.kt)("em",{parentName:"a"},"DiscoveryRequest")),". As a response, a ",(0,a.kt)("a",{parentName:"p",href:"#DiscoveryResponse"},(0,a.kt)("em",{parentName:"a"},"DiscoveryResponse"))," ",(0,a.kt)("em",{parentName:"p"},"shall")," be returned, containing a list of new peers. The new peer nodes in this list ",(0,a.kt)("em",{parentName:"p"},"shall")," be verified by the receiving application."),(0,a.kt)("p",null,"This process is summarized in the following figure and detailed in the following subsections:"),(0,a.kt)("p",null,(0,a.kt)("img",{parentName:"p",src:"https://i.imgur.com/U51tPeK.png",alt:null})),(0,a.kt)("h3",{id:"3321-node-identities"},"3.3.2.1 Node identities"),(0,a.kt)("p",null,"Every node has a cryptographic identity, a key on the ed25519 elliptic curve. The ",(0,a.kt)("inlineCode",{parentName:"p"},"blake2b")," hash of the public key of the peer serves as its identifier or ",(0,a.kt)("inlineCode",{parentName:"p"},"node ID"),"."),(0,a.kt)("h3",{id:"3322-verification"},"3.3.2.2 Verification"),(0,a.kt)("p",null,"The verification process aims at both verifying peer identities and checking their online status. Each peer ",(0,a.kt)("em",{parentName:"p"},"shall")," maintain a list of all the known peers. This list ",(0,a.kt)("em",{parentName:"p"},"shall")," be called ",(0,a.kt)("inlineCode",{parentName:"p"},"known_peer_list"),". Elements of any known peer list ",(0,a.kt)("em",{parentName:"p"},"shall")," contain a reference to a ",(0,a.kt)("a",{parentName:"p",href:"#Peer"},"Peer")," and a time at which it ",(0,a.kt)("em",{parentName:"p"},"shall")," be verified/re-verified.\nAs such, the ",(0,a.kt)("inlineCode",{parentName:"p"},"known_peer_list")," can be seen as a time-priority queue. A newly discovered peer gets added to the list at the current time. Whenever a peer is verified, its time value on the ",(0,a.kt)("inlineCode",{parentName:"p"},"known_peer_list")," gets updated to the time at which that peer ",(0,a.kt)("em",{parentName:"p"},"shall")," be re-verified.\nThe intent of this arrangement is to allow the node application to first verify newly discovered (and thus still unverified) peers and then to re-verify older peers (to confirm their online status) by iterating over the ",(0,a.kt)("inlineCode",{parentName:"p"},"known_peer_list"),".\nIt is worthwhile to note that the order in which the ",(0,a.kt)("inlineCode",{parentName:"p"},"known_peer_list")," is worked through is important. For example, if the peer is added to the front ('head') of the ",(0,a.kt)("inlineCode",{parentName:"p"},"known_peer_list"),", it is possible for an adversary to front-fill the ",(0,a.kt)("inlineCode",{parentName:"p"},"known_peer_list")," with a selection of its own nodes. This is resolved by the use of the time-priority queue."),(0,a.kt)("p",null,"The verification process always initiates from a ",(0,a.kt)("a",{parentName:"p",href:"#Ping"},"Ping"),". Upon reception of a ",(0,a.kt)("a",{parentName:"p",href:"#Ping"},"Ping"),", a peer ",(0,a.kt)("em",{parentName:"p"},"shall")," check its validity by:"),(0,a.kt)("ul",null,(0,a.kt)("li",{parentName:"ul"},"verifying that the signature of the ",(0,a.kt)("a",{parentName:"li",href:"#Ping"},"Ping")," is valid and discarding the request otherwise;"),(0,a.kt)("li",{parentName:"ul"},"checking that the ",(0,a.kt)("inlineCode",{parentName:"li"},"version")," and ",(0,a.kt)("inlineCode",{parentName:"li"},"network_id")," fields match its configuration and discarding the ",(0,a.kt)("a",{parentName:"li",href:"#Ping"},"Ping")," otherwise;"),(0,a.kt)("li",{parentName:"ul"},"checking that the ",(0,a.kt)("inlineCode",{parentName:"li"},"timestamp")," field is fresh (i.e., not older than a given time) and discarding the packet otherwise;"),(0,a.kt)("li",{parentName:"ul"},"checking that the ",(0,a.kt)("inlineCode",{parentName:"li"},"dest_addr")," matches its IP address and discarding the ",(0,a.kt)("a",{parentName:"li",href:"#Ping"},"Ping")," otherwise.")),(0,a.kt)("p",null,"Upon successful validation of a received ",(0,a.kt)("a",{parentName:"p",href:"#Ping"},"Ping"),", a peer ",(0,a.kt)("em",{parentName:"p"},"shall")," respond with a ",(0,a.kt)("a",{parentName:"p",href:"#Pong"},"Pong"),". In case the sender of the ",(0,a.kt)("em",{parentName:"p"},"Ping")," is a new peer from the perspective of the receiving node, the receiver peer ",(0,a.kt)("em",{parentName:"p"},"shall")," add it to its ",(0,a.kt)("inlineCode",{parentName:"p"},"known_peer_list"),". This enables the verification process to also occur in the reverse direction. "),(0,a.kt)("p",null,"Upon reception of a ",(0,a.kt)("a",{parentName:"p",href:"#Pong"},"Pong"),", a peer ",(0,a.kt)("em",{parentName:"p"},"shall")," check its validity by:"),(0,a.kt)("ul",null,(0,a.kt)("li",{parentName:"ul"},"verifying that the signature of the ",(0,a.kt)("a",{parentName:"li",href:"#Pong"},"Pong")," is valid and discarding it otherwise;"),(0,a.kt)("li",{parentName:"ul"},"checking that the ",(0,a.kt)("inlineCode",{parentName:"li"},"req_hash")," field matches a request (i.e. ",(0,a.kt)("em",{parentName:"li"},"Ping"),") previously sent and not expired (i.e., the difference between the timestamp of the ",(0,a.kt)("em",{parentName:"li"},"Ping")," and ",(0,a.kt)("em",{parentName:"li"},"Pong")," is not greater than a given threshold) and discarding the associated ",(0,a.kt)("em",{parentName:"li"},"Ping")," or ",(0,a.kt)("em",{parentName:"li"},"Pong")," otherwise;"),(0,a.kt)("li",{parentName:"ul"},"checking that the ",(0,a.kt)("inlineCode",{parentName:"li"},"dest_addr")," matches its IP address and discarding the associated ",(0,a.kt)("em",{parentName:"li"},"Ping")," or ",(0,a.kt)("em",{parentName:"li"},"Pong")," otherwise.")),(0,a.kt)("p",null,"Upon successful validation of a received ",(0,a.kt)("a",{parentName:"p",href:"#Pong"},"Pong"),", a peer ",(0,a.kt)("em",{parentName:"p"},"shall"),":"),(0,a.kt)("ul",null,(0,a.kt)("li",{parentName:"ul"},"add the peer sender of the ",(0,a.kt)("em",{parentName:"li"},"Pong")," to a list of verified peers called ",(0,a.kt)("inlineCode",{parentName:"li"},"verified_peer_list"),";"),(0,a.kt)("li",{parentName:"ul"},"move the peer entry of the ",(0,a.kt)("inlineCode",{parentName:"li"},"known_peer_list")," to the tail.")),(0,a.kt)("h3",{id:"3323-removal"},"3.3.2.3 Removal"),(0,a.kt)("p",null,"While verifying a new peer, if no or an invalid ",(0,a.kt)("em",{parentName:"p"},"Pong")," is received after ",(0,a.kt)("inlineCode",{parentName:"p"},"max_verify_attempts")," attempts, that node ",(0,a.kt)("em",{parentName:"p"},"shall")," be removed from the ",(0,a.kt)("inlineCode",{parentName:"p"},"known_peer_list"),". Each expected reply should have a timeout such that if no answer is received after that, an attempt is considered concluded and counted as failed. "),(0,a.kt)("p",null,"Each peer on the ",(0,a.kt)("inlineCode",{parentName:"p"},"verified_peer_list")," ",(0,a.kt)("em",{parentName:"p"},"shall")," be re-verified after ",(0,a.kt)("inlineCode",{parentName:"p"},"verification_lifetime")," hours; while re-verifying a peer, if no or invalid ",(0,a.kt)("em",{parentName:"p"},"Pong")," is received after ",(0,a.kt)("inlineCode",{parentName:"p"},"max_reverify_attempts")," attempts, the peer ",(0,a.kt)("em",{parentName:"p"},"shall")," be removed from the ",(0,a.kt)("inlineCode",{parentName:"p"},"verified_peer_list"),"."),(0,a.kt)("h3",{id:"3324-discovery"},"3.3.2.4 Discovery"),(0,a.kt)("p",null,"Each peer entry of the ",(0,a.kt)("inlineCode",{parentName:"p"},"verified_peer_list")," may be used to discover new peers. This process is initiated by sending a ",(0,a.kt)("a",{parentName:"p",href:"#DiscoveryRequest"},"DiscoveryRequest"),"."),(0,a.kt)("p",null,"Upon reception of a ",(0,a.kt)("a",{parentName:"p",href:"#DiscoveryRequest"},"DiscoveryRequest"),", a peer node ",(0,a.kt)("em",{parentName:"p"},"shall")," check its validity by:"),(0,a.kt)("ul",null,(0,a.kt)("li",{parentName:"ul"},"checking that the sender of the ",(0,a.kt)("a",{parentName:"li",href:"#DiscoveryRequest"},"DiscoveryRequest")," is a verified peer (i.e. is stored in the ",(0,a.kt)("inlineCode",{parentName:"li"},"verified_peer_list"),") and discarding the request otherwise;"),(0,a.kt)("li",{parentName:"ul"},"verifying that the signature of the ",(0,a.kt)("a",{parentName:"li",href:"#DiscoveryRequest"},"DiscoveryRequest")," is valid and discarding the request otherwise;"),(0,a.kt)("li",{parentName:"ul"},"checking that the ",(0,a.kt)("inlineCode",{parentName:"li"},"timestamp")," field is fresh (i.e., not older than a given time) and discarding the request otherwise.")),(0,a.kt)("p",null,"Upon successful validation of a received ",(0,a.kt)("a",{parentName:"p",href:"#DiscoveryRequest"},"DiscoveryRequest"),", a peer ",(0,a.kt)("em",{parentName:"p"},"shall")," reply with a ",(0,a.kt)("a",{parentName:"p",href:"#DiscoveryResponse"},"DiscoveryResponse"),"."),(0,a.kt)("p",null,"Upon reception of a ",(0,a.kt)("a",{parentName:"p",href:"#DiscoveryResponse"},"DiscoveryResponse"),", a peer ",(0,a.kt)("em",{parentName:"p"},"shall")," check its validity by:"),(0,a.kt)("ul",null,(0,a.kt)("li",{parentName:"ul"},"verifying that the signature of the ",(0,a.kt)("a",{parentName:"li",href:"#DiscoveryResponse"},"DiscoveryResponse")," is valid and discarding the response otherwise;"),(0,a.kt)("li",{parentName:"ul"},"checking that the ",(0,a.kt)("inlineCode",{parentName:"li"},"req_hash")," field matches a discovery request (i.e. ",(0,a.kt)("em",{parentName:"li"},"DiscoveryRequest"),") previously sent and not expired (i.e., the difference between the timestamp of the ",(0,a.kt)("em",{parentName:"li"},"DiscoveryRequest")," and ",(0,a.kt)("em",{parentName:"li"},"DiscoveryResponse")," is not greater than a given threshold) and discarding the response otherwise.")),(0,a.kt)("p",null,"Upon successful validation of a received ",(0,a.kt)("a",{parentName:"p",href:"#DiscoveryResponse"},"DiscoveryResponse"),", a node ",(0,a.kt)("em",{parentName:"p"},"shall")," add the nodes contained in the ",(0,a.kt)("inlineCode",{parentName:"p"},"peers")," field to the ",(0,a.kt)("inlineCode",{parentName:"p"},"known_peer_list"),"."),(0,a.kt)("h3",{id:"3325-ping-and-pong-layout"},"3.3.2.5 Ping and Pong Layout"),(0,a.kt)("p",null,"Each ",(0,a.kt)("em",{parentName:"p"},"Ping")," and ",(0,a.kt)("em",{parentName:"p"},"Pong")," ",(0,a.kt)("em",{parentName:"p"},"shall")," be encapsulated into a ",(0,a.kt)("inlineCode",{parentName:"p"},"data")," field of a generic ",(0,a.kt)("inlineCode",{parentName:"p"},"Request")," and ",(0,a.kt)("inlineCode",{parentName:"p"},"Response"),". Its ",(0,a.kt)("inlineCode",{parentName:"p"},"type"),"  ",(0,a.kt)("em",{parentName:"p"},"shall")," be specified in the ",(0,a.kt)("inlineCode",{parentName:"p"},"type")," field. Each request and response ",(0,a.kt)("em",{parentName:"p"},"shall")," be signed with the ed25519 private key of the sender's ",(0,a.kt)("a",{parentName:"p",href:"#3321-Node-identities"},"identity")," and ",(0,a.kt)("em",{parentName:"p"},"shall")," contain the related public key, in order to allow the packet receiving node to verify the signature. All the received responses ",(0,a.kt)("em",{parentName:"p"},"shall")," be verified and those with invalid signature ",(0,a.kt)("em",{parentName:"p"},"shall")," be discarded."),(0,a.kt)("h4",{id:"request-and-response-layout"},"Request and Response Layout"),(0,a.kt)("table",null,(0,a.kt)("tr",null,(0,a.kt)("th",null,"Name"),(0,a.kt)("th",null,"Type"),(0,a.kt)("th",null,"Description")),(0,a.kt)("tr",null,(0,a.kt)("td",null,"type"),(0,a.kt)("td",null,"uint8"),(0,a.kt)("td",null,"Defines the type of the request or response.")),(0,a.kt)("tr",null,(0,a.kt)("td",null,"data"),(0,a.kt)("td",null,"ByteArray"),(0,a.kt)("td",null,"contains the payload of the  request or response (e.g., a Ping).")),(0,a.kt)("tr",null,(0,a.kt)("td",null,"public_key"),(0,a.kt)("td",null,"ByteArray[32]"),(0,a.kt)("td",null,"The ed25519 public key of the peer's identity used to verify its signatures.")),(0,a.kt)("tr",null,(0,a.kt)("td",null,"signature"),(0,a.kt)("td",null,"ByteArray[32]"),(0,a.kt)("td",null,"The ed25519 signature of the `data` field, signed by using the private key of the peer's identity."))),(0,a.kt)("h4",{id:"ping"},"Ping"),(0,a.kt)("table",null,(0,a.kt)("tr",null,(0,a.kt)("th",null,"Name"),(0,a.kt)("th",null,"Type"),(0,a.kt)("th",null,"Description")),(0,a.kt)("tr",null,(0,a.kt)("td",null,"version"),(0,a.kt)("td",null,"uint32"),(0,a.kt)("td",null,"The version of the protocol.")),(0,a.kt)("tr",null,(0,a.kt)("td",null,"network_id"),(0,a.kt)("td",null,"uint32"),(0,a.kt)("td",null,"The network identifier.")),(0,a.kt)("tr",null,(0,a.kt)("td",null,"timestamp"),(0,a.kt)("td",null,"time"),(0,a.kt)("td",null,"The unix timestamp of the Ping.")),(0,a.kt)("tr",null,(0,a.kt)("td",null,"src_addr"),(0,a.kt)("td",null,"string"),(0,a.kt)("td",null,'The IP address, in string form, of the sender (e.g., "192.0.2.1", "[2001:db8::1]").')),(0,a.kt)("tr",null,(0,a.kt)("td",null,"src_port"),(0,a.kt)("td",null,"uint32"),(0,a.kt)("td",null,"The listening port of the sender.")),(0,a.kt)("tr",null,(0,a.kt)("td",null,"dst_addr"),(0,a.kt)("td",null,"string"),(0,a.kt)("td",null,"The string form of the receiver's IP address. This provides a way to discover the external address (after NAT)."))),(0,a.kt)("h4",{id:"pong"},"Pong"),(0,a.kt)("table",null,(0,a.kt)("tr",null,(0,a.kt)("th",null,"Name"),(0,a.kt)("th",null,"Type"),(0,a.kt)("th",null,"Description")),(0,a.kt)("tr",null,(0,a.kt)("td",null,"req_hash"),(0,a.kt)("td",null,"ByteArray[32]"),(0,a.kt)("td",null,"The blake2b digest of the corresponding received Ping.")),(0,a.kt)("tr",null,(0,a.kt)("td",{colspan:"1"},"services"),(0,a.kt)("td",{colspan:"2"},(0,a.kt)("details",{open:"true"},(0,a.kt)("summary",null,"Services supported by the Pong sender."),(0,a.kt)("table",null,(0,a.kt)("tr",null,(0,a.kt)("th",null,"Name"),(0,a.kt)("th",null,"Type"),(0,a.kt)("th",null,"Description")),(0,a.kt)("tr",null,(0,a.kt)("td",null,"serviceID"),(0,a.kt)("td",null,"ByteArray[32]"),(0,a.kt)("td",null,"The service ID (e.g., autopeering, gossip, fpc).")),(0,a.kt)("tr",null,(0,a.kt)("td",null,"network"),(0,a.kt)("td",null,"string"),(0,a.kt)("td",null,"The string form of the network (e.g., udp, tcp).")),(0,a.kt)("tr",null,(0,a.kt)("td",null,"port"),(0,a.kt)("td",null,"uint32"),(0,a.kt)("td",null,"The listening port of the service.")))))),(0,a.kt)("tr",null,(0,a.kt)("td",null,"dst_addr"),(0,a.kt)("td",null,"string"),(0,a.kt)("td",null,"the string form of the receiver's IP address. This MUST mirror the src_addr of the Ping's IP packet. It provides a way to discover the external address (after NAT)."))),(0,a.kt)("h4",{id:"discoveryrequest"},"DiscoveryRequest"),(0,a.kt)("table",null,(0,a.kt)("tr",null,(0,a.kt)("th",null,"Name"),(0,a.kt)("th",null,"Type"),(0,a.kt)("th",null,"Description")),(0,a.kt)("tr",null,(0,a.kt)("td",null,"timestamp"),(0,a.kt)("td",null,"time"),(0,a.kt)("td",null,"The unix timestamp of the DiscoveryRequest."))),(0,a.kt)("h4",{id:"discoveryresponse"},"DiscoveryResponse"),(0,a.kt)("table",null,(0,a.kt)("tr",null,(0,a.kt)("th",null,"Name"),(0,a.kt)("th",null,"Type"),(0,a.kt)("th",null,"Description")),(0,a.kt)("tr",null,(0,a.kt)("td",null,"req_hash"),(0,a.kt)("td",null,"ByteArray[32]"),(0,a.kt)("td",null,"The blake2b digest of the corresponding received DiscoveryRequest.")),(0,a.kt)("tr",null,(0,a.kt)("td",{colspan:"1"},"peers"),(0,a.kt)("td",{colspan:"2"},(0,a.kt)("details",{open:"true"},(0,a.kt)("summary",null,"The list of some randomly chosen peers known by the sender of the DiscoveryResponse ",(0,a.kt)("code",null,"between(1,6). ")),(0,a.kt)("table",null,(0,a.kt)("tr",null,(0,a.kt)("th",null,"Name"),(0,a.kt)("th",null,"Type"),(0,a.kt)("th",null,"Description")),(0,a.kt)("tr",null,(0,a.kt)("td",null,"public_key"),(0,a.kt)("td",null,"ByteArray[32]"),(0,a.kt)("td",null,"The ed25519 public key of the peer's identity used to verify its signature.")),(0,a.kt)("tr",null,(0,a.kt)("td",null,"ip"),(0,a.kt)("td",null,"string"),(0,a.kt)("td",null,"The string form of the peer's IP address.")),(0,a.kt)("tr",null,(0,a.kt)("td",{colspan:"1"},"services"),(0,a.kt)("td",{colspan:"2"},(0,a.kt)("details",{open:"true"},(0,a.kt)("summary",null,"Services supported by the peer."),(0,a.kt)("table",null,(0,a.kt)("tr",null,(0,a.kt)("th",null,"Name"),(0,a.kt)("th",null,"Type"),(0,a.kt)("th",null,"Description")),(0,a.kt)("tr",null,(0,a.kt)("td",null,"serviceID"),(0,a.kt)("td",null,"ByteArray[32]"),(0,a.kt)("td",null,"The service ID (e.g., autopeering, gossip, fpc).")),(0,a.kt)("tr",null,(0,a.kt)("td",null,"network"),(0,a.kt)("td",null,"string"),(0,a.kt)("td",null,"The string form of the network (e.g., udp, tcp).")),(0,a.kt)("tr",null,(0,a.kt)("td",null,"port"),(0,a.kt)("td",null,"uint32"),(0,a.kt)("td",null,"The listening port of the service."))))))))))),(0,a.kt)("h3",{id:"3326-denial-of-service"},"3.3.2.6 Denial of Service"),(0,a.kt)("p",null,"All the requests and responses exchanged during the Peer Discovery protocol are sent via UDP. As such, any UDP based Denial of Service attack could harm the normal functionality of the protocol. To limit this, hardware based protection such as Firewall or alternatively, rate limiting the incoming requests and responses via leaky/token buckets based techniques could be used."))}u.isMDXComponent=!0}}]);