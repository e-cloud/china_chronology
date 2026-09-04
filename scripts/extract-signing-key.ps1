<#
.SYNOPSIS
    从包含公钥与私钥混合的 ASC 文件中精准提取 PGP 私钥，并格式化为标准单行字符串（用于 gradle.properties）
.PARAMETER Path
    ASC 密钥文件路径
.PARAMETER MultiLine
    是否输出原始多行格式（默认为单行字面量 \n 格式）
.PARAMETER NoClipboard
    是否禁止自动复制到剪贴板
#>
param (
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$Path,

    [switch]$MultiLine,
    [switch]$NoClipboard
)

if (-not (Test-Path -Path $Path)) {
    Write-Error "文件不存在: $Path"
    exit 1
}

# 读取所有行
$rawLines = Get-Content -Path $Path

$headerMarker = "-----BEGIN PGP PRIVATE KEY BLOCK-----"
$footerMarker = "-----END PGP PRIVATE KEY BLOCK-----"

$insidePrivateBlock = $false
$payloadLines = [System.Collections.Generic.List[string]]::new()

foreach ($rawLine in $rawLines) {
    $line = $rawLine.Trim()

    if ($line -like "*BEGIN PGP PRIVATE KEY BLOCK*") {
        $insidePrivateBlock = $true
        continue
    }

    if ($line -like "*END PGP PRIVATE KEY BLOCK*") {
        $insidePrivateBlock = $false
        break
    }

    if ($insidePrivateBlock) {
        # 忽略公钥内容与私钥内部的无效空行/注释行
        if (-not [string]::IsNullOrWhiteSpace($line) -and -not $line.StartsWith("Version:") -and -not $line.StartsWith("Comment:")) {
            $payloadLines.Add($line)
        }
    }
}

if ($payloadLines.Count -eq 0) {
    Write-Error "未在文件中检测到有效的 PGP PRIVATE KEY 块！"
    exit 1
}

# 按照 RFC 4880 规范组织标准结构：BEGIN -> 空行 -> Base64 Payload -> END
if ($MultiLine) {
    # 纯净多行格式（包含必需的协议空行）
    $result = @(
        $headerMarker,
        "",
        ($payloadLines -join "`n"),
        $footerMarker
    ) -join "`n"
} else {
    # 单行字面量 \n 格式（适配 gradle.properties，保证 BEGIN 后面有两个 \n）
    $result = "$headerMarker\n\n" + ($payloadLines -join '\n') + "\n$footerMarker"
}

# 默认自动复制到剪贴板
if (-not $NoClipboard) {
    Set-Clipboard -Value $result
    Write-Host "✅ 成功从混合 ASC 文件中提取 PGP 私钥！" -ForegroundColor Green
    Write-Host "📋 结果已自动存入系统剪贴板，可直接粘贴至 gradle.properties 或 CI Secrets。" -ForegroundColor Green
}

# 终端输出预览
Write-Output $result