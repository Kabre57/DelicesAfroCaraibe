$ErrorActionPreference = 'Stop'

function Parse-Endpoints($file) {
  $lines = Get-Content $file
  $list = @()
  $p = $null
  foreach($l in $lines){
    if($l -match '^  (/[^:]+):\s*$'){ $p = $matches[1]; continue }
    if($p -and $l -match '^    (get|post|put|delete):\s*$'){ $list += [pscustomobject]@{ path=$p; method=$matches[1].ToUpper() } }
  }
  $list
}

function Service($path){
  switch -Regex ($path) {
    '^/api/auth' { @{tag='Auth';var='baseUrl_auth';port=3101} }
    '^/api/users' { @{tag='Users';var='baseUrl_users';port=3102} }
    '^/api/restaurants|^/api/menu' { @{tag='Restaurants';var='baseUrl_restaurants';port=3103} }
    '^/api/orders' { @{tag='Orders';var='baseUrl_orders';port=3104} }
    '^/api/deliveries' { @{tag='Deliveries';var='baseUrl_deliveries';port=3105} }
    '^/api/payments' { @{tag='Payments';var='baseUrl_payments';port=3106} }
    '^/api/notifications' { @{tag='Notifications';var='baseUrl_notifications';port=3107} }
    '^/api/geocode|^/api/reverse-geocode|^/api/distance|^/api/route|^/api/nearby' { @{tag='Geolocation';var='baseUrl_geolocation';port=3108} }
    '^/api/chat' { @{tag='Chat';var='baseUrl_chat';port=3109} }
    '^/api/upload' { @{tag='Upload';var='baseUrl_upload';port=3110} }
    '^/api/payment|^/webhook' { @{tag='Stripe';var='baseUrl_stripe';port=3111} }
    '^/api/sms' { @{tag='SMS';var='baseUrl_sms';port=3112} }
    '^/api/recommendations|^/api/ai' { @{tag='AI';var='baseUrl_ai';port=3113} }
    '^/api/loyalty|^/api/subscription|^/api/referral' { @{tag='Loyalty';var='baseUrl_loyalty';port=3114} }
    '^/health$' { @{tag='Health';var='baseUrl_auth';port=3101} }
    default { @{tag='Misc';var='baseUrl_auth';port=3101} }
  }
}

function Protected($path,$method){
  if($path -in @('/api/auth/login','/api/auth/register','/health','/webhook')){ return $false }
  if($path -match '^/api/notifications|^/api/payment|^/api/loyalty|^/api/subscription|^/api/referral'){ return $false }
  if($method -eq 'GET' -and ($path -match '^/api/restaurants($|/discover|/\{id\}$|/\{restaurantId\}/menu$|/menu/item/)' -or $path -match '^/api/menu' -or $path -match '^/api/orders/client/' -or $path -match '^/api/orders/restaurant/' -or $path -eq '/api/orders/{id}')){ return $false }
  return $true
}

function ReqRef($path,$method){
  if($method -in @('GET','DELETE')){ return $null }
  if($path -eq '/api/auth/register'){ 'AuthRegisterRequest' }
  elseif($path -eq '/api/auth/login'){ 'AuthLoginRequest' }
  elseif($path -match '^/api/users'){ 'UserWriteRequest' }
  elseif($path -match '^/api/restaurants|^/api/menu'){ 'RestaurantWriteRequest' }
  elseif($path -match '^/api/orders'){ 'OrderWriteRequest' }
  elseif($path -match '^/api/deliveries'){ 'DeliveryWriteRequest' }
  elseif($path -match '^/api/payments'){ 'PaymentWriteRequest' }
  elseif($path -match '^/api/notifications'){ 'NotificationWriteRequest' }
  elseif($path -match '^/api/geocode|^/api/reverse-geocode|^/api/distance|^/api/route|^/api/nearby'){ 'GeolocationWriteRequest' }
  elseif($path -match '^/api/chat'){ 'ChatWriteRequest' }
  elseif($path -match '^/api/upload'){ 'UploadWriteRequest' }
  elseif($path -match '^/api/payment|^/webhook'){ 'StripeWriteRequest' }
  elseif($path -match '^/api/sms'){ 'SmsWriteRequest' }
  elseif($path -match '^/api/recommendations|^/api/ai'){ 'AiWriteRequest' }
  elseif($path -match '^/api/loyalty|^/api/subscription|^/api/referral'){ 'LoyaltyWriteRequest' }
  else { 'GenericWriteRequest' }
}

function ResRef($path){
  if($path -eq '/health'){ return 'HealthResponse' }
  if($path -match '^/api/auth'){ 'AuthResponse' }
  elseif($path -match '^/api/users'){ 'UserResponse' }
  elseif($path -match '^/api/restaurants|^/api/menu'){ 'RestaurantResponse' }
  elseif($path -match '^/api/orders'){ 'OrderResponse' }
  elseif($path -match '^/api/deliveries'){ 'DeliveryResponse' }
  elseif($path -match '^/api/payments'){ 'PaymentResponse' }
  elseif($path -match '^/api/notifications'){ 'NotificationResponse' }
  elseif($path -match '^/api/geocode|^/api/reverse-geocode|^/api/distance|^/api/route|^/api/nearby'){ 'GeolocationResponse' }
  elseif($path -match '^/api/chat'){ 'ChatResponse' }
  elseif($path -match '^/api/upload'){ 'UploadResponse' }
  elseif($path -match '^/api/payment|^/webhook'){ 'StripeResponse' }
  elseif($path -match '^/api/sms'){ 'SmsResponse' }
  elseif($path -match '^/api/recommendations|^/api/ai'){ 'AiResponse' }
  elseif($path -match '^/api/loyalty|^/api/subscription|^/api/referral'){ 'LoyaltyResponse' }
  else { 'GenericResponse' }
}

function Example($schema){
  switch($schema){
    'AuthRegisterRequest' { @{email='john@example.com';password='StrongPass123!';role='CLIENT';firstName='John';lastName='Doe';phone='0600000000';additionalData=@{address='1 Rue Test';city='Paris';postalCode='75001'}} }
    'AuthLoginRequest' { @{email='john@example.com';password='StrongPass123!'} }
    'UserWriteRequest' { @{firstName='John';lastName='Doe';phone='0600000000'} }
    'RestaurantWriteRequest' { @{name='Chez Afro';address='10 Rue';city='Paris';postalCode='75010';phone='0600000000';cuisineType='Ivoirien';openingHours=@{monday='09:00-18:00'}} }
    'OrderWriteRequest' { @{restaurantId='uuid';items=@(@{menuItemId='uuid';quantity=2});deliveryAddress='1 Rue';deliveryCity='Paris';deliveryPostalCode='75001'} }
    'DeliveryWriteRequest' { @{status='ON_ROUTE';message='Incident';deliveryId='uuid'} }
    'PaymentWriteRequest' { @{orderId='uuid';paymentMethod='CARD';transactionId='txn_123'} }
    'NotificationWriteRequest' { @{userId='uuid';type='ORDER';title='Commande';message='Votre commande avance'} }
    'GeolocationWriteRequest' { @{origin='Paris';destination='Lyon';address='10 Downing Street';lat=48.8566;lng=2.3522} }
    'ChatWriteRequest' { @{userId='uuid'} }
    'UploadWriteRequest' { @{} }
    'StripeWriteRequest' { @{amount=1999;currency='eur';customerId='cus_123';priceId='price_123';paymentIntentId='pi_123'} }
    'SmsWriteRequest' { @{to='+33600000000';message='Code 1234';phoneNumber='+33600000000';code='123456';recipients=@('+33600000000')} }
    'AiWriteRequest' { @{userId='uuid';message='Suggestion ?';preferences=@{};restaurantId='uuid'} }
    'LoyaltyWriteRequest' { @{userId='uuid';orderAmount=42.5;rewardId='r1';plan='PREMIUM';referralCode='REFABC'} }
    default { @{} }
  }
}

$schemas = @{
  ErrorResponse=@{type='object';properties=@{error=@{type='string'}};required=@('error')}
  GenericWriteRequest=@{type='object';additionalProperties=$true}
  GenericResponse=@{type='object';additionalProperties=$true}
  HealthResponse=@{type='object';properties=@{status=@{type='string'};service=@{type='string'}}}
  AuthRegisterRequest=@{type='object';required=@('email','password','role','firstName','lastName','phone');properties=@{email=@{type='string'};password=@{type='string'};role=@{type='string'};firstName=@{type='string'};lastName=@{type='string'};phone=@{type='string'};additionalData=@{type='object';additionalProperties=$true}}}
  AuthLoginRequest=@{type='object';required=@('email','password');properties=@{email=@{type='string'};password=@{type='string'}}}
  AuthResponse=@{type='object';additionalProperties=$true}
  UserWriteRequest=@{type='object';additionalProperties=$true}
  UserResponse=@{type='object';additionalProperties=$true}
  RestaurantWriteRequest=@{type='object';additionalProperties=$true}
  RestaurantResponse=@{type='object';additionalProperties=$true}
  OrderWriteRequest=@{type='object';additionalProperties=$true}
  OrderResponse=@{type='object';additionalProperties=$true}
  DeliveryWriteRequest=@{type='object';additionalProperties=$true}
  DeliveryResponse=@{type='object';additionalProperties=$true}
  PaymentWriteRequest=@{type='object';additionalProperties=$true}
  PaymentResponse=@{type='object';additionalProperties=$true}
  NotificationWriteRequest=@{type='object';additionalProperties=$true}
  NotificationResponse=@{type='object';additionalProperties=$true}
  GeolocationWriteRequest=@{type='object';additionalProperties=$true}
  GeolocationResponse=@{type='object';additionalProperties=$true}
  ChatWriteRequest=@{type='object';additionalProperties=$true}
  ChatResponse=@{type='object';additionalProperties=$true}
  UploadWriteRequest=@{type='object';additionalProperties=$true}
  UploadResponse=@{type='object';additionalProperties=$true}
  StripeWriteRequest=@{type='object';additionalProperties=$true}
  StripeResponse=@{type='object';additionalProperties=$true}
  SmsWriteRequest=@{type='object';additionalProperties=$true}
  SmsResponse=@{type='object';additionalProperties=$true}
  AiWriteRequest=@{type='object';additionalProperties=$true}
  AiResponse=@{type='object';additionalProperties=$true}
  LoyaltyWriteRequest=@{type='object';additionalProperties=$true}
  LoyaltyResponse=@{type='object';additionalProperties=$true}
}

$eps = Parse-Endpoints 'docs/openapi.yaml'
$paths = [ordered]@{}
$groups = @{}

foreach($e in $eps){
  $svc = Service $e.path
  if(-not $paths.Contains($e.path)){ $paths[$e.path] = [ordered]@{} }

  $reqRef = ReqRef $e.path $e.method
  $resRef = ResRef $e.path
  $code = if($e.method -eq 'POST' -and $e.path -match '/register$|/support/tickets$|/audit-logs$'){ '201' } elseif($e.method -eq 'DELETE' -and $e.path -notmatch '/chat/'){ '204' } else { '200' }

  $op = [ordered]@{
    tags=@($svc.tag)
    summary="$($e.method) $($e.path)"
    servers=@(@{url="http://localhost:$($svc.port)"})
    responses=[ordered]@{
      $code=@{description='Success';content=@{'application/json'=@{schema=@{'$ref'="#/components/schemas/$resRef"}}}}
      default=@{description='Error';content=@{'application/json'=@{schema=@{'$ref'='#/components/schemas/ErrorResponse'}}}}
    }
  }
  if(Protected $e.path $e.method){ $op.security=@(@{bearerAuth=@()}) }
  if($reqRef){
    $op.requestBody=@{required=$true;content=@{'application/json'=@{schema=@{'$ref'="#/components/schemas/$reqRef"};example=(Example $reqRef)}}}
  }
  if($e.path -match '\{'){
    $params=@()
    [regex]::Matches($e.path,'\{([^}]+)\}') | ForEach-Object { $params += @{name=$_.Groups[1].Value;in='path';required=$true;schema=@{type='string'}} }
    $op.parameters=$params
  }

  $paths[$e.path][$e.method.ToLower()] = $op

  if(-not $groups.ContainsKey($svc.tag)){ $groups[$svc.tag] = @() }
  $req = [ordered]@{method=$e.method;header=@(@{key='Content-Type';value='application/json'});url=@{raw=(("{{{{{0}}}}}{1}" -f $svc.var, $e.path));host=@(("{{{{{0}}}}}" -f $svc.var));path=($e.path.TrimStart('/') -split '/')}}
  if(Protected $e.path $e.method){ $req.header += @{key='Authorization';value='Bearer {{jwt_token}}'} }
  if($reqRef){ $req.body=@{mode='raw';raw=((Example $reqRef)|ConvertTo-Json -Depth 20);options=@{raw=@{language='json'}}} }
  $groups[$svc.tag] += @{name="$($e.method) $($e.path)";request=$req;response=@()}
}

$openapi = [ordered]@{
  openapi='3.0.3'
  info=@{title='Delices Afro Caraibe API (Enriched)';version='1.1.0';description='Spec enrichie avec schemas request/response par endpoint (groupes par domaine de route).'}
  components=@{securitySchemes=@{bearerAuth=@{type='http';scheme='bearer';bearerFormat='JWT'}};schemas=$schemas}
  paths=$paths
}
$openapi | ConvertTo-Json -Depth 100 | Set-Content docs/openapi.enriched.json -Encoding utf8

$items=@()
foreach($k in ($groups.Keys | Sort-Object)){ $items += @{name=$k;item=@($groups[$k])} }
$postman = [ordered]@{
  info=@{name='Delices Afro Caraibe API';_postman_id=[guid]::NewGuid().Guid;schema='https://schema.getpostman.com/json/collection/v2.1.0/collection.json';description='Collection generee depuis docs/openapi.yaml'}
  item=$items
  variable=@(
    @{key='jwt_token';value=''},
    @{key='baseUrl_auth';value='http://localhost:3101'},
    @{key='baseUrl_users';value='http://localhost:3102'},
    @{key='baseUrl_restaurants';value='http://localhost:3103'},
    @{key='baseUrl_orders';value='http://localhost:3104'},
    @{key='baseUrl_deliveries';value='http://localhost:3105'},
    @{key='baseUrl_payments';value='http://localhost:3106'},
    @{key='baseUrl_notifications';value='http://localhost:3107'},
    @{key='baseUrl_geolocation';value='http://localhost:3108'},
    @{key='baseUrl_chat';value='http://localhost:3109'},
    @{key='baseUrl_upload';value='http://localhost:3110'},
    @{key='baseUrl_stripe';value='http://localhost:3111'},
    @{key='baseUrl_sms';value='http://localhost:3112'},
    @{key='baseUrl_ai';value='http://localhost:3113'},
    @{key='baseUrl_loyalty';value='http://localhost:3114'}
  )
}
$postman | ConvertTo-Json -Depth 100 | Set-Content docs/postman_collection.json -Encoding utf8
Write-Output 'Generated docs/openapi.enriched.json and docs/postman_collection.json'


