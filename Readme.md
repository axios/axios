axios
versión npm CDNJS estado de construcción cobertura de código instalar tamaño descargas npm charla gitter ayudantes de código

Cliente HTTP basado en promesas para el navegador y node.js

Tabla de contenido
Caracteristicas
Soporte del navegador
Instalando
Ejemplo
API de Axios
Solicitar alias de métodos
Simultaneidad (obsoleta)
Creando una instancia
Métodos de instancia
Solicitar configuración
Esquema de respuesta
Configuración predeterminada
Valores predeterminados de axios globales
Valores predeterminados de instancias personalizadas
Orden de precedencia de configuración
Interceptores
Manejo de errores
Cancelación
Usando el formato application / x-www-form-urlencoded
Navegador
Node.js
Cadena de consulta
Formulario de datos
Semver
Promesas
Mecanografiado
Recursos
Créditos
Licencia
Caracteristicas
Hacer XMLHttpRequests desde el navegador
Realizar solicitudes http desde node.js
Admite la API Promise
Interceptar solicitud y respuesta
Transformar los datos de solicitud y respuesta
Cancelar solicitudes
Transformaciones automáticas para datos JSON
Soporte del lado del cliente para protegerse contra XSRF
Soporte del navegador
Cromo	Firefox	Safari	Ópera	Borde	ES DECIR
Último ✔	Último ✔	Último ✔	Último ✔	Último ✔	11 ✔
Matriz del navegador

Instalando
Usando npm:

$ npm instalar axios
Usando bower:

$ bower instalar axios
Usando hilo:

$ hilo agregar axios
Usando jsDelivr CDN:

< script  src = " https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js " > </ script >
Usando Unkg CDN:

< script  src = " https://unpkg.com/axios/dist/axios.min.js " > </ script >
Ejemplo
nota: uso de CommonJS
Para obtener las mecanografías de TypeScript (para intellisense / autocompletar) mientras usa importaciones de CommonJS, require()use el siguiente enfoque:

const  axios  =  require ( 'axios' ) . por defecto ;

// axios. <method> ahora proporcionará autocompletado y tipificación de parámetros
Realización de una GETsolicitud

const  axios  =  require ( 'axios' ) ;

// Realizar una solicitud para un usuario con un ID determinado 
axios . get ( '/ user? ID = 12345' ) 
  . luego ( función  ( respuesta )  { 
    // manejar correctamente la 
    consola . log ( respuesta ) ; 
  } ) 
  . catch ( function  ( error )  { 
    // manejar la 
    consola de errores . log ( error ) ; 
  } ) 
  . entonces ( función  ( ) { 
    // siempre ejecutado 
  } ) ;

// Opcionalmente, la solicitud anterior también se puede realizar como 
axios . get ( '/ usuario' ,  { 
    params : { 
      ID : 12345 
    } 
  } ) 
  . luego ( función  ( respuesta )  { 
    consola . registro ( respuesta ) ; 
  } ) 
  . catch ( función  ( error )  { 
    consola . log ( error ) ; 
  } )
  . then ( function  ( )  { 
    // siempre se ejecuta 
  } ) ;  

// ¿Quieres usar async / await? Agrega la palabra clave `async` a tu función / método externo. 
función asíncrona  getUser ( ) { try { respuesta constante = aguardar axios . get ( '/ user? ID = 12345' ) ; consola . log ( respuesta ) ; } captura ( error ) { consola . error ( error ) ; } }  
   
        
    
     
    
  
NOTA: async/await es parte de ECMAScript 2017 y no es compatible con Internet Explorer y navegadores más antiguos, por lo que debe usarse con precaución.

Realización de una POSTsolicitud

axios . posterior ( '/ user' ,  { 
    primerNombre : 'Fred' , 
    lastName : 'Picapiedra' 
  } ) 
  . luego ( función  ( respuesta )  { 
    consola . registro ( respuesta ) ; 
  } ) 
  . catch ( función  ( error )  { 
    consola . registro ( error ) ; 
  } ) ;
Realización de múltiples solicitudes simultáneas

function  getUserAccount ( )  { 
  devolver  axios . obtener ( '/ usuario / 12345' ) ; 
}

function  getUserPermissions ( )  { 
  return  axios . get ( '/ usuario / 12345 / permisos' ) ; 
}

Promesa . all ( [ getUserAccount ( ) ,  getUserPermissions ( ) ] ) 
  . luego ( de función  ( resultados )  { 
    const  acct  =  resultados [ 0 ] ; 
    const  perm  =  resultados [ 1 ] ; 
  } ) ;
API de axios
Las solicitudes se pueden realizar pasando la configuración relevante a axios.

axios (config)
// envía una solicitud POST 
axios ( { 
  método : 'post' , 
  url : '/ user / 12345' , 
  de datos : { 
    primerNombre : 'Fred' , 
    lastName : 'Picapiedra' 
  } 
} ) ;
// GET solicitud de imagen remota en node.js 
axios ( { 
  método : 'get' , 
  url : 'http://bit.ly/2mTM3nY' , 
  responseType : 'stream' 
} ) 
  . luego ( función  ( respuesta )  { 
    respuesta . datos . tubería ( fs . createWriteStream ( 'ada_lovelace.jpg' ) ) 
  } ) ;
axios (url [, config])
// Enviar una solicitud GET (método predeterminado) 
axios ( '/ user / 12345' ) ;
Solicitar alias de métodos
Para mayor comodidad, se han proporcionado alias para todos los métodos de solicitud admitidos.

axios.request (config)
axios.get (url [, config])
axios.delete (url [, config])
axios.head (url [, config])
axios.options (url [, config])
axios.post (url [, data [, config]])
axios.put (url [, data [, config]])
axios.patch (url [, data [, config]])
NOTA
Al utilizar los métodos de alias url, methody datapropiedades no necesitan ser especificado en config.

Simultaneidad (obsoleta)
Utilice Promise.allpara reemplazar las siguientes funciones.

Funciones de ayuda para tratar solicitudes concurrentes.

axios.all (iterable) axios.spread (devolución de llamada)

Creando una instancia
Puede crear una nueva instancia de axios con una configuración personalizada.

axios.create ([config])
 instancia  constante =  axios . create ( { 
  baseURL : 'https://some-domain.com/api/' , 
  timeout : 1000 , 
  headers : { 'X-Custom-Header' : 'foobar' } 
} ) ;
Métodos de instancia
Los métodos de instancia disponibles se enumeran a continuación. La configuración especificada se fusionará con la configuración de la instancia.

axios # request (config)
axios # get (url [, config])
axios # delete (url [, config])
axios # head (url [, config])
axios # opciones (url [, config])
axios # post (url [, data [, config]])
axios # put (url [, data [, config]])
axios # patch (url [, data [, config]])
axios # getUri ([config])
Solicitar configuración
Estas son las opciones de configuración disponibles para realizar solicitudes. Solo urlse requiere el. Las solicitudes se establecerán de forma predeterminada en GETsi methodno se especifica.

{ 
  // `url` es la URL del servidor que se utilizará para la 
  URL de solicitud : '/ usuario' ,

  // `método` es el método de solicitud que se utilizará al realizar el 
  método de solicitud : 'get' ,  // predeterminado

  // `baseURL` se antepondrá a` url` a menos que `url` sea absoluta. 
  // Puede ser conveniente establecer `baseURL` para una instancia de axios para pasar URL relativas 
  // a los métodos de esa instancia. 
  baseURL : 'https://some-domain.com/api/' ,

  // `transformRequest` permite cambios en los datos de la solicitud antes de que se envíen al servidor 
  // Esto solo se aplica a los métodos de solicitud 'PUT', 'POST', 'PATCH' y 'DELETE' 
  // La última función de la matriz debe devolver una cadena o una instancia de Buffer, ArrayBuffer, 
  // FormData o Stream 
  // Puede modificar el objeto de encabezados. 
  transformRequest : [ función  ( datos ,  encabezados )  { 
    // Haz lo que quieras para transformar los datos

    devolver  datos ; 
  } ] ,

  // `transformResponse` permite que se realicen cambios en los datos de respuesta antes 
  // de que se pasen a / catch 
  transformResponse : [ function  ( data )  { 
    // Haz lo que quieras para transformar los datos

    devolver  datos ; 
  } ] ,

  // `headers` son encabezados personalizados para enviar 
  encabezados : { 'X-Requested-With' : 'XMLHttpRequest' } ,

  // `params` son los parámetros de URL que se enviarán con la solicitud 
  // Debe ser un objeto simple o un objeto URLSearchParams 
  params : { 
    ID : 12345 
  } ,

  // `paramsSerializer` es una función opcional encargada de serializar` params` 
  // (por ejemplo, https://www.npmjs.com/package/qs, http://api.jquery.com/jquery.param/) 
  paramsSerializer : function  ( params )  { 
    return  Qs . stringify ( params ,  { arrayFormat : 'brackets' } ) 
  } ,

  // `data` son los datos que se enviarán como el cuerpo de la solicitud 
  // Solo se aplica a los métodos de solicitud 'PUT', 'POST', 'DELETE y' PATCH ' 
  // Cuando no se establece una` transformRequest`, debe ser de uno de los siguientes tipos: 
  // - cadena, objeto simple, ArrayBuffer, ArrayBufferView, URLSearchParams 
  // - Solo navegador: FormData, File, Blob 
  // - Solo nodo: Stream, Buffer 
  data : { 
    firstName : 'Fred' 
  } ,
  
  // alternativa de sintaxis para enviar datos al cuerpo 
  // publicación del método 
  // solo se envía el valor, no los 
  datos clave : 'Country = Brasil & City = Belo Horizonte' ,

  // `timeout` especifica el número de milisegundos antes de que se agote el tiempo de espera de la solicitud. 
  // Si la solicitud tarda más de "timeout", la solicitud se cancelará. 
  timeout : 1000 ,  // el valor predeterminado es `0` (sin tiempo de espera)

  // `withCredentials` indica si las solicitudes de control de acceso entre sitios 
  // deben realizarse utilizando credenciales con 
  Credentials : false ,  // default

  // `adapter` permite el manejo personalizado de solicitudes, lo que facilita las pruebas. 
  // Devuelve una promesa y proporciona una respuesta válida (consulta lib / adapters / README.md). 
  adaptador : función  ( config )  { 
    / * ... * / 
  } ,

  // `auth` indica que se debe utilizar la autenticación básica HTTP y proporciona las credenciales. 
  // Esto establecerá un encabezado de `Autorización`, sobrescribiendo cualquier 
  // encabezado personalizado de` Autorización` 
  existente que haya configurado usando `encabezados`. // Tenga en cuenta que solo la autenticación básica HTTP se puede configurar a través de este parámetro. 
  // Para tokens de portador y demás, use encabezados personalizados `Autorización` en su lugar. 
  auth : { 
    nombre de usuario : 'janedoe' , 
    contraseña : 's00pers3cret' 
  } ,

  // `responseType` indica el tipo de datos con los que el servidor responderá 
  // las opciones son: 'arraybuffer', 'document', 'json', 'text', 'stream' 
  // solo navegador: 'blob' 
  responseType : 'json' ,  // predeterminado

  // `responseEncoding` indica la codificación que se usará para decodificar las respuestas (solo Node.js) 
  // Nota: Ignorado para` responseType` de 'stream' o solicitudes del lado del cliente 
  responseEncoding : 'utf8' ,  // predeterminado

  // `xsrfCookieName` es el nombre de la cookie que se utilizará como valor para el token 
  xsrf xsrfCookieName : 'XSRF-TOKEN' ,  // predeterminado

  // `xsrfHeaderName` es el nombre del encabezado http que lleva el valor del token 
  xsrf xsrfHeaderName : 'X-XSRF-TOKEN' ,  // predeterminado

  // `onUploadProgress` permite el manejo de eventos de progreso para cargas 
  // navegador solo 
  onUploadProgress : function  ( progressEvent )  { 
    // Haz lo que quieras con el evento de progreso nativo 
  } ,

  // `onDownloadProgress` permite el manejo de eventos de progreso para descargas 
  // navegador solo 
  onDownloadProgress : function  ( progressEvent )  { 
    // Haz lo que quieras con el evento de progreso nativo 
  } ,

  // `maxContentLength` define el tamaño máximo del contenido de respuesta http en bytes permitido en node.js 
  maxContentLength : 2000 ,

  // `maxBodyLength` (opción de solo nodo) define el tamaño máximo del contenido de la solicitud http en bytes permitidos 
  maxBodyLength : 2000 ,

  // `validateStatus` define si resolver o rechazar la promesa para un 
  código de estado de respuesta // HTTP 
  dado . Si `validateStatus` devuelve` true` (o se establece en `null` // 
  o` undefined`), la promesa se resolverá; de lo contrario, la promesa será // rechazada. 
  validateStatus : función  ( estado )  { 
    estado de retorno  > = 200 && estado < 300 ; // predeterminado } ,     
  

  // `maxRedirects` define el número máximo de redireccionamientos a seguir en node.js. 
  // Si se establece en 0, no se seguirán las redirecciones. 
  maxRedirects : 5 ,  // predeterminado

  // `socketPath` define un socket UNIX que se utilizará en node.js. 
  // por ejemplo, '/var/run/docker.sock' para enviar solicitudes al demonio de la ventana acoplable. 
  // Solo se puede especificar `socketPath` o` proxy`. 
  // Si se especifican ambos, se usa `socketPath`. 
  socketPath : null ,  // predeterminado

  // `httpAgent` y` httpsAgent` definen un agente personalizado que se utilizará al realizar 
  solicitudes 
  http // y https, respectivamente, en node.js. Esto permite agregar opciones como // `keepAlive` que no están habilitadas por defecto. 
  httpAgent : nuevo  http . Agente ( {  keepAlive : true  } ) , 
  httpsAgent : nuevo  https . Agente ( {  keepAlive : true  } ) ,

  // `proxy` defines the hostname, port, and protocol of the proxy server.
  // You can also define your proxy using the conventional `http_proxy` and
  // `https_proxy` environment variables. If you are using environment variables
  // for your proxy configuration, you can also define a `no_proxy` environment
  // variable as a comma-separated list of domains that should not be proxied.
  // Use `false` to disable proxies, ignoring environment variables.
  // `auth` indicates that HTTP Basic auth should be used to connect to the proxy, and
  // supplies credentials.
  // This will set an `Proxy-Authorization` header, overwriting any existing
  // `Proxy-Authorization` custom headers you have set using `headers`.
  // Si el servidor proxy utiliza HTTPS, debe configurar el protocolo en `https`. 
  proxy : { 
    protocolo : 'https' , 
    host : '127.0.0.1' , 
    puerto : 9000 , 
    auth : { 
      nombre de usuario : 'mikeymike' , 
      contraseña : 'rapunz3l' 
    } 
  } ,

  // `cancelToken` especifica un token de cancelación que se puede utilizar para cancelar la solicitud 
  // (consulte la sección de Cancelación a continuación para obtener más detalles) 
  cancelToken : new  CancelToken ( function  ( cancel )  { 
  } ) ,

  // `descomprimir` indica si el cuerpo de la respuesta debe descomprimirse 
  // automáticamente. Si se establece en `true` también eliminará el encabezado 'content-encoding' 
  // de los objetos de respuesta de todas las respuestas descomprimidas 
  // - Solo nodo (XHR no puede desactivar la descompresión) 
  descomprimir : verdadero  // predeterminado

}
Esquema de respuesta
La respuesta a una solicitud contiene la siguiente información.

{ 
  // `data` es la respuesta proporcionada por el servidor 
  data : { } ,

  //'Estado` es el código de estado HTTP de la respuesta del servidor 
  de estado : 200 ,

  // `statusText` es el mensaje de estado HTTP de la respuesta del servidor 
  statusText : 'OK' ,

  // `encabezados` los encabezados HTTP con los que respondió el servidor 
  // Todos los nombres de los encabezados están en minúsculas y se puede acceder a ellos usando la notación entre corchetes. 
  // Ejemplo: `response.headers ['content-type']` 
  headers : { } ,

  // `config` es la configuración que se proporcionó a` axios` para la solicitud 
  config : { } ,

  // `request` es la solicitud que generó esta respuesta 
  // Es la última instancia de ClientRequest en node.js (en redirecciones) 
  // y una instancia XMLHttpRequest en la 
  solicitud del navegador : { } 
}
Cuando lo use then, recibirá la respuesta de la siguiente manera:

axios . obtener ( '/ usuario / 12345' ) 
  . entonces ( función  ( respuesta )  { 
    consola . log ( respuesta . datos ) ; 
    consola . log ( respuesta . estado ) ; 
    consola . log ( respuesta . statusText ) ; 
    consola . log ( respuesta . cabeceras ) ; 
    consola .log ( respuesta . config ) ; 
  } ) ;
Al usar catcho pasar una devolución de llamada de rechazo como segundo parámetro de then, la respuesta estará disponible a través del errorobjeto como se explica en la sección Manejo de errores .

Configuración predeterminada
Puede especificar los valores predeterminados de configuración que se aplicarán a cada solicitud.

Valores predeterminados de axios globales
axios . valores predeterminados . baseURL  =  'https://api.example.com' ;

// Importante: Si axios se usa con varios dominios, el AUTH_TOKEN se enviará a todos ellos. 
// Vea a continuación un ejemplo que usa valores predeterminados de instancia personalizada en su lugar. 
axios . valores predeterminados . encabezados . común [ 'Autorización' ]  =  AUTH_TOKEN ;

axios . valores predeterminados . encabezados . post [ 'Content-Type' ]  =  'application / x-www-form-urlencoded' ;
Valores predeterminados de instancias personalizadas
// Establezca los valores predeterminados de configuración al crear la instancia 
const  instance  =  axios . crear ( { 
  baseURL : 'https://api.example.com' 
} ) ;

// Modificar los valores predeterminados después de que se haya creado la 
instancia . valores predeterminados . encabezados . común [ 'Autorización' ]  =  AUTH_TOKEN ;
Orden de precedencia de configuración
La configuración se fusionará con un orden de precedencia. El orden son los valores predeterminados de la biblioteca que se encuentran en lib / defaults.js , luego la defaultspropiedad de la instancia y, finalmente, el configargumento de la solicitud. Este último tendrá prioridad sobre el primero. He aquí un ejemplo.

// Cree una instancia usando los valores predeterminados de configuración proporcionados por la biblioteca 
// En este punto, el valor de configuración de tiempo de espera es `0` como es el predeterminado para la biblioteca 
const  instance  =  axios . crear ( ) ;

// Anular el tiempo de espera predeterminado para la biblioteca 
// Ahora todas las solicitudes que utilizan esta instancia esperarán 2,5 segundos antes de agotar el tiempo de espera de la 
instancia . valores predeterminados . tiempo de espera  =  2500 ;

// Anula el tiempo de espera para esta solicitud, ya que se sabe que toma una 
instancia de mucho tiempo . get ( '/ longRequest' ,  { 
  tiempo de espera : 5000 
} ) ;
Interceptores
Puede interceptar solicitudes o respuestas antes de que sean manejadas por theno catch.

// Agrega un interceptor de solicitud 
axios . interceptores . solicitud . use ( function  ( config )  { 
    // Haga algo antes de que se envíe la solicitud 
    return  config ; 
  } ,  function  ( error )  { 
    // Haga algo con la solicitud error 
    return  Promise . accept ( error ) ; 
  } ) ;

// Agrega un interceptor de respuesta 
axios . interceptores . respuesta . use ( function  ( respuesta )  { 
    // Cualquier código de estado que se encuentre dentro del rango de 2xx hace que esta función se active 
    // Haga algo con los datos de 
    respuesta return  response ; 
  } ,  function  ( error )  { 
    // Cualquier código de estado que esté fuera del gama de 2xx causa de esta función de desencadenar la 
    // hacer algo con error de respuesta 
    de retorno  promesa . rechazará ( de error ) ; 
  }) ;
Si necesita eliminar un interceptor más tarde, puede hacerlo.

const  myInterceptor  =  axios . interceptores . solicitud . use ( función  ( )  { /*...*/ } ) ; 
axios . interceptores . solicitud . expulsar ( myInterceptor ) ;
Puede agregar interceptores a una instancia personalizada de axios.

 instancia  constante =  axios . crear ( ) ; 
instancia . interceptores . solicitud . use ( función  ( )  { /*...*/ } ) ;
Manejo de errores
axios . obtener ( '/ usuario / 12345' ) 
  . catch ( function  ( error )  { 
    if  ( error . response )  { 
      // Se realizó la solicitud y el servidor respondió con un código de estado 
      // que cae fuera del rango de 2xx 
      console . log ( error . response . data ) ; 
      console . log ( error . respuesta . estado ) ; 
      consola .log ( error . respuesta . encabezados ) ; 
    }  Demás  si  ( error . Petición )  { 
      // La solicitud fue hecha pero no se recibió ninguna respuesta 
      // `error.request` es una instancia de XMLHttpRequest en el navegador y una instancia de 
      // http.ClientRequest en Node.js 
      consola . log ( error . solicitud ) ; 
    }  else  { 
      // Algo sucedió al configurar la solicitud que desencadenó una 
      consola de error . log ( 'Error',  error . mensaje ) ; 
    } 
    consola . log ( error . config ) ; 
  } ) ;
Con la validateStatusopción de configuración, puede definir códigos HTTP que deberían generar un error.

axios . get ( '/ user / 12345' ,  { 
  validateStatus : function  ( status )  { 
    return  status  <  500 ;  // Resolver solo si el código de estado es menor que 500 
  } 
} )
Using toJSON you get an object with more information about the HTTP error.

axios.get('/user/12345')
  .catch(function (error) {
    console.log(error.toJSON());
  });
Cancellation
You can cancel a request using a cancel token.

The axios cancel token API is based on the withdrawn cancelable promises proposal.

You can create a cancel token using the CancelToken.source factory as shown below:

const CancelToken = axios.CancelToken;
const source = CancelToken.source();

axios.get('/user/12345', {
  cancelToken: source.token
}).catch(function (thrown) {
  if (axios.isCancel(thrown)) {
    console.log('Request canceled', thrown.message);
  } else {
    // handle error
  }
});

axios.post('/user/12345', {
  name: 'new name'
}, {
  cancelToken: source.token
})

// cancel the request (the message parameter is optional)
source.cancel('Operation canceled by the user.');
You can also create a cancel token by passing an executor function to the CancelToken constructor:

const CancelToken = axios.CancelToken;
let cancel;

axios . get ( '/ user / 12345' ,  { 
  cancelToken : new  CancelToken ( function  ejecutor ( c )  { 
    // Una función ejecutora recibe una función de cancelación como parámetro 
    cancel  =  c ; 
  } ) 
} ) ;

// cancelar la solicitud 
cancel ( ) ;
Nota: puede cancelar varias solicitudes con el mismo token de cancelación.

Usando el formato application / x-www-form-urlencoded
De forma predeterminada, axios serializa objetos JavaScript en JSON. Para enviar datos en el application/x-www-form-urlencodedformato, puede usar una de las siguientes opciones.

Navegador
En un navegador, puede utilizar la URLSearchParamsAPI de la siguiente manera:

const  params  =  new  URLSearchParams ( ) ; 
params . append ( 'param1' ,  'valor1' ) ; 
params . append ( 'param2' ,  'valor2' ) ; 
axios . publicación ( '/ foo' ,  params ) ;
Tenga en cuenta que URLSearchParamsno es compatible con todos los navegadores (consulte caniuse.com ), pero hay un polyfill disponible (asegúrese de polyfill el entorno global).

Alternativamente, puede codificar datos usando la qsbiblioteca:

const  qs  =  require ( 'qs' ) ; 
axios . publicar ( '/ foo' ,  qs . stringify ( {  'bar' : 123  } ) ) ;
O de otra forma (ES6),

importar  qs  de  'qs' ; 
const  datos  =  {  'barra' : 123  } ; 
const  options  =  { 
  método : 'POST' , 
  encabezados : {  'content-type' : 'application / x-www-form-urlencoded'  } , 
  data : qs . stringify ( datos ) , 
  url , 
} ; 
axios ( opciones ) ;
Node.js
Cadena de consulta
En node.js, puede usar el querystringmódulo de la siguiente manera:

const  querystring  =  require ( 'querystring' ) ; 
axios . poste ( 'http://something.com/' ,  cadena de consulta . stringify ( {  foo : 'bar'  } ) ) ;
o 'URLSearchParams' del 'módulo url' de la siguiente manera:

const  url  =  require ( 'url' ) ; 
const  params  =  nueva  URL . URLSearchParams ( {  foo : 'bar'  } ) ; 
axios . publicar ( 'http://algo.com/' ,  params . toString ( ) ) ;
También puede utilizar la qsbiblioteca.

NOTA
La qsbiblioteca es preferible si necesita secuenciar objetos anidados, ya que el querystringmétodo tiene problemas conocidos con ese caso de uso ( https://github.com/nodejs/node-v0.x-archive/issues/1665 ).

Formulario de datos
En node.js, puede usar la form-databiblioteca de la siguiente manera:

const  FormData  =  require ( 'formulario-datos' ) ;
 
 forma  constante =  new  FormData ( ) ; 
forma . append ( 'mi_campo' ,  'mi valor' ) ; 
forma . append ( 'my_buffer' ,  new  Buffer ( 10 ) ) ; 
forma . append ( 'mi_archivo' ,  fs . createReadStream ( '/foo/bar.jpg' ) ) ;

axios . publicación ( 'https://example.com' ,  formulario ,  {  encabezados : formulario . getHeaders ( )  } )
Alternativamente, use un interceptor:

axios . interceptores . solicitud . use ( config  =>  { 
  if  ( config . data  instanceof  FormData )  { 
    Object . assign ( config . headers ,  config . data . getHeaders ( ) ) ; 
  } 
  return  config ; 
} ) ;
Semver
Hasta que axios llegue a un 1.0lanzamiento, se lanzarán cambios importantes con una nueva versión menor. Por ejemplo 0.5.1, y 0.5.4tendrá la misma API, pero 0.6.0tendrá cambios importantes.

Promesas
axios depende de una implementación nativa de ES6 Promise para ser compatible . Si su entorno no es compatible con ES6 Promises, puede realizar polyfill .

Mecanografiado
axios incluye definiciones de TypeScript .

importar  axios  de  'axios' ; 
axios . get ( '/ user? ID = 12345' ) ;
Recursos
Registro de cambios
Guía de actualización
Ecosistema
Guía contribuyente
Código de Conducta
Créditos
axios está muy inspirado en el servicio $ http proporcionado en Angular . En última instancia, axios es un esfuerzo por proporcionar un $httpservicio independiente para usar fuera de Angular.

Licencia
MIT
