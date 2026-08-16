/* eslint-disable no-useless-escape */

export type CodeTokenBucket = {
  /** 0 = brightest, up to ~5 = darkest */
  level: number
  tokens: string[]
}

export type CodeTokenPool = {
  id: string
  label: string
  width: number
  buckets: CodeTokenBucket[]
}

function pad(t: string, w: number) {
  return t.slice(0, w).padEnd(w)
}

function tokens(w: number, ...t: string[]) {
  return t.map((s) => pad(s, w))
}

const W = 5

export const CODE_TOKEN_POOLS: CodeTokenPool[] = [
  {
    id: 'python',
    label: 'Python',
    width: W,
    buckets: [
      {
        level: 0,
        tokens: tokens(
          W,
          '     ',
          '  _  ',
          '  .  ',
          '  :  ',
          '  ,  ',
          '  #  ',
          '  =  ',
        ),
      },
      {
        level: 1,
        tokens: tokens(
          W,
          ' def ',
          'class',
          '  if ',
          '  in ',
          ' not ',
          '  or ',
          ' and ',
          ' for ',
        ),
      },
      {
        level: 2,
        tokens: tokens(
          W,
          'import',
          ' from ',
          ' True ',
          'False ',
          ' None ',
          'pass ',
          'yield',
          'raise',
          'with ',
          'await',
          'async',
        ),
      },
      {
        level: 3,
        tokens: tokens(
          W,
          ' +=  ',
          ' !=  ',
          ' ==  ',
          '  -> ',
          ' **  ',
          ' //  ',
          'self.',
          '__  ',
          ' @pr ',
          'elif ',
        ),
      },
      {
        level: 4,
        tokens: tokens(
          W,
          ' (*) ',
          ' [0] ',
          ' {k} ',
          ' """  ',
          'lambda',
          '(*args',
          '{**x}',
          '[::] ',
          '  \\\\  ',
          'type ',
        ),
      },
    ],
  },
  {
    id: 'csharp',
    label: 'C#',
    width: W,
    buckets: [
      {
        level: 0,
        tokens: tokens(W, '     ', '  .  ', '  ;  ', '  :  ', '  ,  ', '  =  '),
      },
      {
        level: 1,
        tokens: tokens(
          W,
          ' var ',
          ' int ',
          ' new ',
          '  if ',
          ' for ',
          'using',
          'class',
          'async',
          'await',
        ),
      },
      {
        level: 2,
        tokens: tokens(
          W,
          'public',
          'static',
          'string',
          'return',
          'throw',
          ' null ',
          ' task ',
          'await ',
        ),
      },
      {
        level: 3,
        tokens: tokens(
          W,
          ' +=  ',
          ' !=  ',
          ' ==  ',
          '  => ',
          ' ??  ',
          '?.   ',
          ' []  ',
          ' [A] ',
          ':this',
        ),
      },
      {
        level: 4,
        tokens: tokens(
          W,
          ' (*) ',
          ' {0} ',
          ' \".\" ',
          ' const',
          '<<  >>',
          ' {get}',
          ' {set}',
          '!.   ',
          '  ??!',
        ),
      },
    ],
  },
  {
    id: 'cpp',
    label: 'C++',
    width: W,
    buckets: [
      {
        level: 0,
        tokens: tokens(W, '     ', '  .  ', '  ;  ', '  :  ', '  ,  ', '  =  '),
      },
      {
        level: 1,
        tokens: tokens(
          W,
          ' int ',
          ' auto',
          '  if ',
          ' for ',
          ' void',
          'const',
          'using',
          'class',
        ),
      },
      {
        level: 2,
        tokens: tokens(
          W,
          'return',
          'throw',
          'emplace',
          'sizeof',
          ' delete',
          ' new  ',
          'struct',
          'typedef',
        ),
      },
      {
        level: 3,
        tokens: tokens(
          W,
          ' *ptr ',
          ' &ref ',
          '  -> ',
          '  :: ',
          ' +=  ',
          ' !=  ',
          ' ==  ',
          ' <T> ',
        ),
      },
      {
        level: 4,
        tokens: tokens(
          W,
          ' (*) ',
          ' &  & ',
          '  \\\\  ',
          '  ## ',
          '#define',
          'pragma',
          '<>::<>',
          ' (*f) ',
        ),
      },
    ],
  },
  {
    id: 'html',
    label: 'HTML',
    width: W,
    buckets: [
      { level: 0, tokens: tokens(W, '     ', '  .  ', '  -  ', '  =  ') },
      {
        level: 1,
        tokens: tokens(
          W,
          ' <div',
          ' </> ',
          ' <p> ',
          ' <a  ',
          ' <li ',
          ' <ul ',
          'class',
          ' href',
        ),
      },
      {
        level: 2,
        tokens: tokens(
          W,
          ' data-',
          ' aria-',
          ' \".\" ',
          ' <nav',
          ' <img',
          ' <svg',
          '<!-- ',
          ' -->  ',
        ),
      },
      {
        level: 3,
        tokens: tokens(
          W,
          ' id=\" ',
          '=\"js\"',
          ' />  ',
          ' <sec',
          '</div',
          '</nav',
          ' role',
          ' type',
        ),
      },
      {
        level: 4,
        tokens: tokens(
          W,
          ' \"#\"  ',
          ' {   }',
          ' &lt;',
          ' &gt;',
          ' &amp',
          ' <!DO',
          '<html',
          '  \\\"  ',
        ),
      },
    ],
  },
  {
    id: 'js',
    label: 'JavaScript',
    width: W,
    buckets: [
      {
        level: 0,
        tokens: tokens(W, '     ', '  .  ', '  ;  ', '  :  ', '  ,  ', '  =  '),
      },
      {
        level: 1,
        tokens: tokens(
          W,
          ' let ',
          ' var ',
          'const',
          '  if ',
          ' for ',
          '  of ',
          '  in ',
          'async',
        ),
      },
      {
        level: 2,
        tokens: tokens(
          W,
          'return',
          'await',
          'export',
          'import',
          ' from ',
          'function',
          ' null ',
          ' typeof',
        ),
      },
      {
        level: 3,
        tokens: tokens(
          W,
          ' =>  ',
          ' +=  ',
          ' !=  ',
          ' ==  ',
          ' ??  ',
          '?.   ',
          ' ${ } ',
          ' ...  ',
        ),
      },
      {
        level: 4,
        tokens: tokens(
          W,
          ' (*) ',
          ' [0] ',
          ' {k} ',
          ' //  ',
          '  \\\\  ',
          'new ',
          'class',
          'delete',
        ),
      },
    ],
  },
  {
    id: 'go',
    label: 'Go',
    width: W,
    buckets: [
      {
        level: 0,
        tokens: tokens(W, '     ', '  .  ', '  :  ', '  ,  ', '  =  '),
      },
      {
        level: 1,
        tokens: tokens(
          W,
          ' func',
          '  if ',
          ' for ',
          ' var ',
          '  := ',
          '  _  ',
          'struct',
          ' defer',
        ),
      },
      {
        level: 2,
        tokens: tokens(
          W,
          ' err  ',
          ' nil  ',
          ' range',
          'select',
          'return',
          'import',
          ' panic',
          ' chan ',
        ),
      },
      {
        level: 3,
        tokens: tokens(
          W,
          '  ::= ',
          '  {}  ',
          '  []  ',
          '  ... ',
          ' *  * ',
          '  <-  ',
          '  ->  ',
          '  ;;  ',
        ),
      },
      {
        level: 4,
        tokens: tokens(
          W,
          ' err!=',
          ' make[',
          '  \\\\  ',
          ' iota ',
          '  /*  ',
          '  */  ',
          'interface',
          'func()',
        ),
      },
    ],
  },
  {
    id: 'linux',
    label: 'Linux',
    width: W,
    buckets: [
      {
        level: 0,
        tokens: tokens(W, '     ', '  .  ', '  _  ', '  -  ', '  /  ', '  ~  '),
      },
      {
        level: 1,
        tokens: tokens(
          W,
          '  $  ',
          '  #  ',
          '  >  ',
          '  |  ',
          '  &  ',
          '  ;  ',
          '  *  ',
          '  %  ',
        ),
      },
      {
        level: 2,
        tokens: tokens(
          W,
          ' sudo',
          ' apt ',
          ' grep',
          ' echo',
          '  ls ',
          '  cd ',
          'make',
          ' git ',
          ' cat ',
        ),
      },
      {
        level: 3,
        tokens: tokens(
          W,
          ' |   ',
          ' &&  ',
          ' ||  ',
          ' 2>&1',
          ' 2>  ',
          ' /tmp',
          '/usr/',
          ' /etc',
          ' /dev',
        ),
      },
      {
        level: 4,
        tokens: tokens(
          W,
          ' /bin',
          ' #!/ ',
          '  \\\\  ',
          '  \"\"  ',
          '  {{ ',
          '  }} ',
          ' ::/ ',
          '  *.* ',
        ),
      },
    ],
  },
  {
    id: 'bash',
    label: 'Bash',
    width: W,
    buckets: [
      {
        level: 0,
        tokens: tokens(W, '     ', '  .  ', '  _  ', '  -  ', '  $  ', '  #  '),
      },
      {
        level: 1,
        tokens: tokens(
          W,
          '  if ',
          ' for ',
          '  do ',
          'done ',
          ' fi  ',
          'then ',
          'else ',
          'elif ',
        ),
      },
      {
        level: 2,
        tokens: tokens(
          W,
          ' echo',
          ' grep',
          ' sed ',
          ' awk ',
          '  ls ',
          '  cd ',
          'exit ',
          '  sh ',
        ),
      },
      {
        level: 3,
        tokens: tokens(
          W,
          ' |   ',
          ' &&  ',
          ' ||  ',
          '2>&1 ',
          ' >   ',
          ' >>  ',
          ' <(  ',
          ' $(  ',
        ),
      },
      {
        level: 4,
        tokens: tokens(
          W,
          '${ } ',
          ' \\\\  ',
          '  "  ',
          " \\'  ",
          ' /dev',
          ' #!  ',
          'chmod',
          'set -',
        ),
      },
    ],
  },
]

export function getTokenPool(id: string): CodeTokenPool | undefined {
  return CODE_TOKEN_POOLS.find((p) => p.id === id)
}

export function pickToken(
  pool: CodeTokenPool,
  lum01: number,
  invert: boolean,
): string {
  const clamped = Math.min(1, Math.max(0, lum01))
  const norm = invert ? clamped : 1 - clamped
  const bucketIndex = Math.min(
    pool.buckets.length - 1,
    Math.floor(norm * pool.buckets.length),
  )
  const bucket = pool.buckets[bucketIndex] ?? { tokens: [] }
  if (bucket.tokens.length === 0) return ' '.repeat(pool.width)
  // Keep renders and exports reproducible for identical input and settings.
  const idx = Math.min(
    bucket.tokens.length - 1,
    Math.floor(clamped * bucket.tokens.length),
  )
  return bucket.tokens[idx] ?? ' '.repeat(pool.width)
}
