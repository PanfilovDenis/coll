module.exports = (compound) ->
  defaultModules = [
    'jugglingdb',
    'co-assets-compiler',
    'co-socket',
    'diff',
    'heap'
  ]

  developmentModules = []
  if compound.app.get('env') is 'development'
    developmentModules = [
      'ejs-ext',
      'seedjs',
      'co-generators'
    ]

  unless window?
    return defaultModules.concat(developmentModules).map(require)
  else
    return []