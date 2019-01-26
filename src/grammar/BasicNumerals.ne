@preprocessor esmodule

@{%
function c(val) {
  return () => val;
}
%}

#######################################
# 11.8.3 #sec-literals-numeric-literals

# #prod-DecimalDigits
DecimalDigits ->
    DecimalDigit               {% ([DecimalDigit]) => [DecimalDigit, 1n] %}
  | DecimalDigits DecimalDigit {% ([[DecimalDigits, n], DecimalDigit]) => [DecimalDigits * 10n + DecimalDigit, n + 1n] %}

# #prod-DecimalDigit
DecimalDigit ->
    "0" {% c(0n) %}
  | "1" {% c(1n) %}
  | "2" {% c(2n) %}
  | "3" {% c(3n) %}
  | "4" {% c(4n) %}
  | "5" {% c(5n) %}
  | "6" {% c(6n) %}
  | "7" {% c(7n) %}
  | "8" {% c(8n) %}
  | "9" {% c(9n) %}

# #prod-NonZeroDigit
NonZeroDigit ->
    "1" {% c(1n) %}
  | "2" {% c(2n) %}
  | "3" {% c(3n) %}
  | "4" {% c(4n) %}
  | "5" {% c(5n) %}
  | "6" {% c(6n) %}
  | "7" {% c(7n) %}
  | "8" {% c(8n) %}
  | "9" {% c(9n) %}

# #prod-HexDigits
HexDigits ->
    HexDigit           {% ([HexDigit]) => HexDigit %}
  | HexDigits HexDigit {% ([HexDigits, HexDigit]) => HexDigits * 16n + HexDigit %}

# #prod-HexDigit
HexDigit ->
    "0"  {% c(0n) %}
  | "1"  {% c(1n) %}
  | "2"  {% c(2n) %}
  | "3"  {% c(3n) %}
  | "4"  {% c(4n) %}
  | "5"  {% c(5n) %}
  | "6"  {% c(6n) %}
  | "7"  {% c(7n) %}
  | "8"  {% c(8n) %}
  | "9"  {% c(9n) %}
  | "a"i {% c(10n) %}
  | "b"i {% c(11n) %}
  | "c"i {% c(12n) %}
  | "d"i {% c(13n) %}
  | "e"i {% c(14n) %}
  | "f"i {% c(15n) %}
