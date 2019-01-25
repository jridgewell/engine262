@preprocessor esmodule

# Pattern[U, N] ::
#     Disjunction[?U, ?N]
Pattern ->
    Disjunction
Pattern_U ->
    Disjunction_U
Pattern_N ->
    Disjunction_N
Pattern_U_N ->
    Disjunction_U_N

# Disjunction[U, N] ::
#     Alternative[?U, ?N]
#     Alternative[?U, ?N] | Disjunction[?U, ?N]
Disjunction ->
    Alternative
  | Alternative  "|" Disjunction
Disjunction_U ->
    Alternative_U
  | Alternative_U  "|" Disjunction_U
Disjunction_N ->
    Alternative_N
  | Alternative_N  "|" Disjunction_N
Disjunction_U_N ->
    Alternative_U_N
  | Alternative_U_N  "|" Disjunction_U_N

# Alternative[U, N] ::
#     [empty]
#     Alternative[?U, ?N] Term[?U, ?N]
Alternative ->
    null
  | Alternative Term
Alternative_U ->
    null
  | Alternative_U Term_U
Alternative_N ->
    null
  | Alternative_N Term_N
Alternative_U_N ->
    null
  | Alternative_U_N Term_U_N

# Term[U, N] ::
#     Assertion[?U, ?N]
#     Atom[?U, ?N]
#     Atom[?U, ?N] Quantifier
Term ->
    Assertion
  | Atom
  | Atom Quantifier
Term_U ->
    Assertion_U
  | Atom_U
  | Atom_U Quantifier
Term_N ->
    Assertion_N
  | Atom_N
  | Atom_N Quantifier
Term_U_N ->
    Assertion_U_N
  | Atom_U_N
  | Atom_U_N Quantifier

# Assertion[U, N]::
#     ^
#     $
#     \ b
#     \ B
#     (?= Disjunction[?U, ?N] )
#     (?! Disjunction[?U, ?N] )
#     (?<= Disjunction[?U, ?N] )
#     (?<! Disjunction[?U, ?N] )
Assertion ->
    "^"
  | "$"
  | "\\b"
  | "\\B"
  | "(?=" Disjunction ")"
  | "(?!" Disjunction ")"
  | "(?<=" Disjunction ")"
  | "(?<!" Disjunction ")"
Assertion_U ->
    "^"
  | "$"
  | "\\b"
  | "\\B"
  | "(?=" Disjunction_U ")"
  | "(?!" Disjunction_U ")"
  | "(?<=" Disjunction_U ")"
  | "(?<!" Disjunction_U ")"
Assertion_N ->
    "^"
  | "$"
  | "\\b"
  | "\\B"
  | "(?=" Disjunction_N ")"
  | "(?!" Disjunction_N ")"
  | "(?<=" Disjunction_N ")"
  | "(?<!" Disjunction_N ")"
Assertion_U_N ->
    "^"
  | "$"
  | "\\b"
  | "\\B"
  | "(?=" Disjunction_U_N ")"
  | "(?!" Disjunction_U_N ")"
  | "(?<=" Disjunction_U_N ")"
  | "(?<!" Disjunction_U_N ")"

# Quantifier ::
#     QuantifierPrefix
#     QuantifierPrefix ?
Quantifier ->
    QuantifierPrefix
  | QuantifierPrefix "?"


# QuantifierPrefix ::
#     *
#     +
#     ?
#     { DecimalDigits }
#     { DecimalDigits , }
#     { DecimalDigits , DecimalDigits }
QuantifierPrefix ->
    "*"
  | "+"
  | "?"
  | "{" DecimalDigits "}"
  | "{" DecimalDigits ",}"
  | "{" DecimalDigits "," DecimalDigits "}"

# Atom[U, N] ::
#     PatternCharacter
#     .
#     \ AtomEscape[?U, ?N]
#     CharacterClass[?U]
#     ( GroupSpecifier[?U] Disjunction[?U, ?N] )
#     ( ? : Disjunction[?U, ?N] )
Atom ->
    PatternCharacter
  | "."
  | "\\" AtomEscape
  | CharacterClass
  | "(" GroupSpecifier Disjunction ")"
  | "(?:" Disjunction ")"
Atom_U ->
    PatternCharacter
  | "."
  | "\\" AtomEscape_U
  | CharacterClass_U
  | "(" GroupSpecifier_U Disjunction_U ")"
  | "(?:" Disjunction_U ")"
Atom_N ->
    PatternCharacter
  | "."
  | "\\" AtomEscape_N
  | CharacterClass
  | "(" GroupSpecifier Disjunction_N ")"
  | "(?:" Disjunction_N ")"
Atom_U_N ->
    PatternCharacter
  | "."
  | "\\" AtomEscape_U_N
  | CharacterClass_U
  | "(" GroupSpecifier_U Disjunction_U_N ")"
  | "(?:" Disjunction_U_N ")"

# SyntaxCharacter :: one of
#     ^$\.*+?()[]{}|
SyntaxCharacter ->
    [$^\\.*+?()[\]{}|]

# PatternCharacter ::
#     SourceCharacter but not SyntaxCharacter
PatternCharacter ->
    SourceCharacter {% ([c], _, reject) => /[$^\\.*+?()[\]{}|]/.test(c) ? reject : { PatternCharacter: c } %}

# AtomEscape[U, N] ::
#     DecimalEscape
#     CharacterClassEscape[?U]
#     CharacterEscape[?U]
#     [+N] k GroupName[?U]
AtomEscape ->
    DecimalEscape
  | CharacterClassEscape
  | CharacterEscape
AtomEscape_U ->
    DecimalEscape
  | CharacterClassEscape_U
  | CharacterEscape_U
AtomEscape_N ->
    DecimalEscape
  | CharacterClassEscape
  | CharacterEscape
  | "k" GroupName
AtomEscape_U_N ->
    DecimalEscape
  | CharacterClassEscape_U
  | CharacterEscape_U
  | "k" GroupName_U

# CharacterEscape[U] ::
#     ControlEscape
#     c ControlLetter
#     0 [lookahead ∉ DecimalDigit]
#     HexEscapeSequence
#     RegExpUnicodeEscapeSequence[?U]
#     IdentityEscape[?U]
CharacterEscape ->
    ControlEscape
  | "c" ControlLetter
  | "0" # TODO [lookahead ∉ DecimalDigit]
  | HexEscapeSequence
  | RegExpUnicodeEscapeSequence
  | IdentityEscape
CharacterEscape_U ->
    ControlEscape
  | "c" ControlLetter
  | "0" # TODO [lookahead ∉ DecimalDigit]
  | HexEscapeSequence
  | RegExpUnicodeEscapeSequence_U
  | IdentityEscape_U

# ControlEscape :: one of
#     fnrtv
ControlEscape ->
    [fnrtv]

# ControlLetter :: one of
#     abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ
ControlLetter ->
    [abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ]

# GroupSpecifier[U] ::
#     [empty]
#     ? GroupName[?U]
GroupSpecifier ->
    null
  | "?" GroupName
GroupSpecifier_U ->
    null
  | "?" GroupName_U

# GroupName[U] ::
#     < RegExpIdentifierName[?U] >
GroupName ->
    "<" RegExpIdentifierName ">"
GroupName_U ->
    "<" RegExpIdentifierName_U ">"

# RegExpIdentifierName[U] ::
#     RegExpIdentifierStart[?U]
#     RegExpIdentifierName[?U] RegExpIdentifierPart[?U]
RegExpIdentifierName ->
    RegExpIdentifierStart
  | RegExpIdentifierName RegExpIdentifierPart
RegExpIdentifierName_U ->
    RegExpIdentifierStart_U
  | RegExpIdentifierName_U RegExpIdentifierPart_U

# RegExpIdentifierStart[U] ::
#     UnicodeIDStart
#     $
#     _
#     \ RegExpUnicodeEscapeSequence[?U]
RegExpIdentifierStart ->
    [a-zA-Z]# TODO UnicodeIDStart
  | "$"
  | "_"
  | "\\" RegExpUnicodeEscapeSequence
RegExpIdentifierStart_U ->
    [a-zA-Z]# TODO UnicodeIDStart
  | "$"
  | "_"
  | "\\" RegExpUnicodeEscapeSequence_U

# RegExpIdentifierPart[U] ::
#     UnicodeIDContinue
#     $
#     \ RegExpUnicodeEscapeSequence[?U]
#     <ZWNJ>
#     <ZWJ>
RegExpIdentifierPart ->
    [a-zA-Z0-9] # TODO UnicodeIDContinue
  | "$"
  | "\\" RegExpUnicodeEscapeSequence
  | [\u200C]
  | [\u200D]
RegExpIdentifierPart_U ->
    [a-zA-Z0-9] # TODO UnicodeIDContinue
  | "$"
  | "\\" RegExpUnicodeEscapeSequence_U
  | [\u200C]
  | [\u200D]

# RegExpUnicodeEscapeSequence[U] ::
# [+U] u LeadSurrogate \u TrailSurrogate
# [+U] u LeadSurrogate
# [+U] u TrailSurrogate
# [+U] u NonSurrogate
# [~U] u Hex4Digits
# [+U] u{ CodePoint }
RegExpUnicodeEscapeSequence ->
    "u" Hex4Digits
RegExpUnicodeEscapeSequence_U ->
    "u" LeadSurrogate "\\u" TrailSurrogate
  | "u" LeadSurrogate
  | "u" TrailSurrogate
  | "u" NonSurrogate
  | "u{" CodePoint "}"

# TODO Each \u TrailSurrogate for which the choice of associated u LeadSurrogate is ambiguous shall be associated with the nearest possible u LeadSurrogate that would otherwise have no corresponding \u TrailSurrogate.

# LeadSurrogate ::
#     Hex4Digitsbut only if the SV of Hex4Digits is in the inclusive range 0xD800 to 0xDBFF
LeadSurrogate ->
    Hex4Digits # TODO but only if the SV of Hex4Digits is in the inclusive range 0xD800 to 0xDBFF

# TrailSurrogate ::
#     Hex4Digitsbut only if the SV of Hex4Digits is in the inclusive range 0xDC00 to 0xDFFF
TrailSurrogate ->
    Hex4Digits # TODO but only if the SV of Hex4Digits is in the inclusive range 0xDC00 to 0xDFFF

# NonSurrogate ::
#     Hex4Digitsbut only if the SV of Hex4Digits is not in the inclusive range 0xD800 to 0xDFFF
NonSurrogate ->
    Hex4Digits # TODO but only if the SV of Hex4Digits is not in the inclusive range 0xD800 to 0xDFFF

# IdentityEscape[U] ::
# [+U] SyntaxCharacter
# [+U] /
# [~U] SourceCharacter but not UnicodeIDContinue
IdentityEscape ->
    SourceCharacter # TODO SourceCharacter but not UnicodeIDContinue
IdentityEscape_U ->
    SyntaxCharacter
  | "/"

# DecimalEscape ::
# NonZeroDigitDecimalDigits_opt [lookahead ∉ DecimalDigit]
DecimalEscape ->
    NonZeroDigit # TODO [lookahead ∉ DecimalDigit]
  | NonZeroDigit DecimalDigits # TODO [lookahead ∉ DecimalDigit]

# CharacterClassEscape[U] ::
#     d
#     D
#     s
#     S
#     w
#     W
#     [+U] p{ UnicodePropertyValueExpression }
#     [+U] P{ UnicodePropertyValueExpression }
CharacterClassEscape ->
    "d"
  | "D"
  | "s"
  | "S"
  | "w"
  | "W"
CharacterClassEscape_U ->
    "d"
  | "D"
  | "s"
  | "S"
  | "w"
  | "W"
  | "p{" UnicodePropertyValueExpression "}"
  | "P{" UnicodePropertyValueExpression "}"

# UnicodePropertyValueExpression ::
#     UnicodePropertyName = UnicodePropertyValue
#     LoneUnicodePropertyNameOrValue
UnicodePropertyValueExpression ->
    UnicodePropertyName "=" UnicodePropertyValue
  | LoneUnicodePropertyNameOrValue

# UnicodePropertyName ::
#     UnicodePropertyNameCharacters
UnicodePropertyName ->
    UnicodePropertyNameCharacters

# UnicodePropertyNameCharacters ::
#     UnicodePropertyNameCharacter UnicodePropertyNameCharacters_opt
UnicodePropertyNameCharacters ->
    UnicodePropertyNameCharacter
  | UnicodePropertyNameCharacter UnicodePropertyNameCharacters

# UnicodePropertyValue ::
#     UnicodePropertyValueCharacters
UnicodePropertyValue ->
    UnicodePropertyValueCharacters

# LoneUnicodePropertyNameOrValue ::
#     UnicodePropertyValueCharacters
LoneUnicodePropertyNameOrValue ->
    UnicodePropertyValueCharacters

# UnicodePropertyValueCharacters ::
#     UnicodePropertyValueCharacter UnicodePropertyValueCharacters_opt
UnicodePropertyValueCharacters ->
    UnicodePropertyValueCharacter
  | UnicodePropertyValueCharacter UnicodePropertyValueCharacters

# UnicodePropertyValueCharacter ::
#     UnicodePropertyNameCharacter
#     0
#     1
#     2
#     3
#     4
#     5
#     6
#     7
#     8
#     9
UnicodePropertyValueCharacter ->
    UnicodePropertyNameCharacter
  | [0-9]

# UnicodePropertyNameCharacter ::
#     ControlLetter
#     _
UnicodePropertyNameCharacter ->
    ControlLetter
  | "_"

# CharacterClass[U] ::
#     [ [lookahead ∉ { ^ } ] ClassRanges[?U] ]
#     [ ^ClassRanges[?U] ]
CharacterClass ->
    "[" ClassRanges "]" # TODO [lookahead ∉ { ^ }]
  | "[^" ClassRanges "]"
CharacterClass_U ->
    "[" ClassRanges_U "]" # TODO [lookahead ∉ { ^ }]
  | "[^" ClassRanges_U "]"

# ClassRanges[U] ::
#     [empty]
#     NonemptyClassRanges[?U]
ClassRanges ->
    null
  | NonemptyClassRanges
ClassRanges_U ->
    null
  | NonemptyClassRanges_U

# NonemptyClassRanges[U] ::
#     ClassAtom[?U]
#     ClassAtom[?U] NonemptyClassRangesNoDash[?U]
#     ClassAtom[?U] - ClassAtom[?U] ClassRanges[?U]
NonemptyClassRanges ->
    ClassAtom
  | ClassAtom NonemptyClassRangesNoDash
  | ClassAtom "-" ClassAtom ClassRanges
  NonemptyClassRanges_U ->
    ClassAtom_U
  | ClassAtom_U NonemptyClassRangesNoDash_U
  | ClassAtom_U "-" ClassAtom_U ClassRanges_U

# NonemptyClassRangesNoDash[U] ::
#     ClassAtom[?U]
#     ClassAtomNoDash[?U] NonemptyClassRangesNoDash[?U]
#     ClassAtomNoDash[?U] - ClassAtom[?U] ClassRanges[?U]
NonemptyClassRangesNoDash ->
    ClassAtom
  | ClassAtomNoDash NonemptyClassRangesNoDash
  | ClassAtomNoDash "-" ClassAtom ClassRanges
NonemptyClassRangesNoDash_U ->
    ClassAtom_U
  | ClassAtomNoDash_U NonemptyClassRangesNoDash_U
  | ClassAtomNoDash_U "-" ClassAtom_U ClassRanges_U

# ClassAtom[U] ::
#     -
#     ClassAtomNoDash[?U]
ClassAtom ->
    "-"
  | ClassAtomNoDash
ClassAtom_U ->
    "-"
  | ClassAtomNoDash_U

# ClassAtomNoDash[U] ::
#   SourceCharacter but not one of \ or ] or -
#   \ ClassEscape[?U]
ClassAtomNoDash ->
    SourceCharacter {% ([c], _, reject) => /[\\\]-]/.test(c) ? reject : c %}
  | "\\" ClassEscape
ClassAtomNoDash_U ->
    SourceCharacter {% ([c], _, reject) => /[\\\]-]/.test(c) ? reject : c %}
  | "\\" ClassEscape_U

# ClassEscape[U] ::
#     b
#     [+U] -
#     CharacterClassEscape[?U]
#     CharacterEscape[?U]
ClassEscape ->
    "b"
  | CharacterClassEscape
  | CharacterEscape
ClassEscape_U ->
    "b"
  | "-"
  | CharacterClassEscape_U
  | CharacterEscape_U

# DecimalDigits ::
#     DecimalDigit
#     DecimalDigitsDecimalDigit
DecimalDigits ->
    DecimalDigit
  | DecimalDigits DecimalDigit

# DecimalDigit :: one of
#     0123456789
DecimalDigit ->
    [0-9]

# HexEscapeSequence ::
#     x HexDigit HexDigit
HexEscapeSequence ->
    "x" HexDigit HexDigit

# Hex4Digits ::
#     HexDigit HexDigit HexDigit HexDigit
Hex4Digits ->
    HexDigit HexDigit HexDigit HexDigit

# HexDigit :: one of
#     0123456789abcdefABCDEF
HexDigit ->
    [0-9a-fA-F]

# CodePoint ::
#     HexDigits but only if MV of HexDigits ≤ 0x10FFFF
CodePoint ->
    HexDigits # TODO HexDigits but only if MV of HexDigits ≤ 0x10FFFF

# HexDigits ::
#     HexDigit
#     HexDigits HexDigit
HexDigits ->
    HexDigit
  | HexDigits HexDigit

# NonZeroDigit :: one of
#     123456789
NonZeroDigit ->
    [1-9]

# SourceCharacter ::
#     any Unicode code point
SourceCharacter ->
    . {% id %}
