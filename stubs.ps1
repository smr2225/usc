# USC 2222 — генератор заглушек разделов (32 файла)
$ErrorActionPreference = 'Stop'
$utf8 = New-Object System.Text.UTF8Encoding($false)

$sections = @(
  @{ code='svts'; name=@{ ru='Советы';      en='Soviets';      fr='Soviets';      es='Soviets' } },
  @{ code='cnst'; name=@{ ru='Конституция'; en='Constitution'; fr='Constitution'; es='Constitución' } },
  @{ code='thry'; name=@{ ru='Диамат';      en='Diamat';       fr='Diamat';       es='Diamat' } },
  @{ code='clnd'; name=@{ ru='Календарь';   en='Calendar';     fr='Calendrier';   es='Calendario' } },
  @{ code='dscn'; name=@{ ru='Обсуждения';  en='Discussions';  fr='Discussions';  es='Discusiones' } },
  @{ code='hist'; name=@{ ru='Истории';     en='Stories';      fr='Histoires';    es='Historias' } },
  @{ code='glsr'; name=@{ ru='Глоссарий';   en='Glossary';     fr='Glossaire';    es='Glosario' } },
  @{ code='bout'; name=@{ ru='О сайте';     en='About';        fr='À propos';     es='Acerca de' } }
)
$brand = @{ ru='Марс'; en='Mars'; fr='Mars'; es='Marte' }
$note  = @{ en='This section is being written in Russian.';
            fr='Cette section est rédigée en russe.';
            es='Esta sección se está escribiendo en ruso.' }

foreach ($s in $sections) {
  $code = $s.code
  New-Item -ItemType Directory -Force -Path $code | Out-Null
  foreach ($lang in @('ru','en','es','fr')) {
    $h1 = $s.name[$lang]
    $title = "$($brand[$lang]) · 2222 — $h1"
    if ($lang -eq 'ru') {
      $body = @"
  <section class="hero">
    <div class="hero-emblem">◈</div>
    <h1>$h1</h1>
    <p class="hero-year">2222</p>
  </section>
  <section class="panel">
    <h2>Раздел готовится</h2>
    <p>Контент появится в ближайших выпусках.</p>
  </section>
"@
    } else {
      $msg = $note[$lang]
      $body = @"
  <section class="hero">
    <div class="hero-emblem">◈</div>
    <h1>$h1</h1>
    <p class="hero-year">2222</p>
  </section>
  <section class="panel">
    <p class="stub-note">$msg</p>
    <a class="btn-primary" href="${code}_ru.html">Читать на русском →</a>
  </section>
"@
    }
    $html = @"
<!DOCTYPE html>
<html lang="$lang" data-lang="$lang">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>$title</title>
  <link rel="stylesheet" href="../main.css">
</head>
<body class="landing" data-inject="chrome" data-base="../">
$body
  <script src="../main.js"></script>
</body>
</html>
"@
    [System.IO.File]::WriteAllText((Join-Path $code ("${code}_${lang}.html")), $html, $utf8)
  }
}
Write-Host 'Готово: 8 папок, 32 файла.'