$SolutionDir = "$PSScriptRoot\..\.."
$ProjectDir = "$PSScriptRoot"

& $SolutionDir\flatbuffers\flatc.exe -n --gen-onefile -o $ProjectDir $ProjectDir\Schema.fbs
