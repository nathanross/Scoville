module.exports = (grunt) ->
  grunt.initConfig
    pkg: grunt.file.readJSON('package.json')
    watch:
      options:
        spawn: false
    mkdir:
      gen:
        options:
          create: ["gen/1.queued", "gen/2.modeprocess_done", 
                  "gen/3.minimalasm_done", "gen/perf", "gen/spec"]
    copy: 
      all: 
        cwd: './src/benches/'
        src: '*'
        dest: 'gen/1.queued'
        expand: true
      byfile: 
        cwd: 'src/benches/'
        src: 'NA'
        dest: 'gen/1.queued'
        expand: true     
    shell:
      modeSpec:
        command: "src/macros/./basic_macro SPEC gen/1.queued gen/2.modeprocess_done"
      modePerf:
        command: "src/macros/./basic_macro PERF gen/1.queued gen/2.modeprocess_done"
    sweetjs: 
      options: 
        modules : ["./node_modules/minimalasm/mnlasm.sjs"]
        readableNames : true
      main: 
        src : "gen/2.modeprocess_done/*"
        dest : "gen/3.minimalasm_done/"      
      doneSpec: 
        src : "gen/2.modeprocess_done/*"
        dest : "gen/spec/"  
      donePerf: 
        src : "gen/2.modeprocess_done/*"
        dest : "gen/perf/"
    uglify : 
      doneSpec: 
        files: [{
          expand: true
          cwd : "gen/3.minimalasm_done/"
          src : "*"
          dest : "gen/spec"      
        }]
      donePerf: 
        files: [{
          expand: true
          cwd : "gen/3.minimalasm_done/"
          src : "*"
          dest : "gen/perf"      
        }]
    clean : 
      b_queued : ["gen/1.queued/*"]
      b_modeproc : ["gen/2.modeprocess_done/*"]
      b_sjs : ["gen/3.minimalasm_done/*"]
      b_build: ["gen/1.queued/*", "gen/2.modeprocess_done/*", "gen/3/minimalasm_done/*"]
      b_complete : ["gen/perf/*", "gen/spec/*"]
      b_all: ["gen/perf/*", "gen/spec/*",
          "gen/1.queued/*", "gen/2.modeprocess_done/*", "gen/3/minimalasm_done/*",
          "gen/*"] 
      # use complete or all when you've renamed or deleted a previously existing bench
      #all: 
    karma:
      unit:
        configFile: 'karma.conf.js'

  require('load-grunt-tasks')(grunt);

  # because we have a multi-step preprocessing chain
  # and benchmarks are not interdependent
  # we only want to change individual files as they are changed
  # rather than reprocess the entire folder every time one
  # src file is changed.
  grunt.event.on "watch", (action, filepath) -> 
                 grunt.config("copy.main.src", filepath)
  # bench tests are about testing that when we
  # measure the speed of a certain asm.js behavior
  # implementation we are measuring a correct behavior
  # implementation. Measuring a functionally different
  # implementation than as described will usually have
  # performance impacts. 
  grunt.registerTask('compileSpecs',
        ['mkdir:gen', 'copy:all',
         'shell:modeSpec', 'clean:b_queued',
        'sweetjs:doneSpec', 'clean:b_modeproc']);
  #       'sweetjs:main', 'clean:b_modeproc',
  #       'uglify:doneSpec', 'clean:b_sjs']);
  grunt.registerTask('compilePerfs',
        ['mkdir:gen', 'copy:all',
         'shell:modePerf', 'clean:b_queued',
  #      'sweetjs:donePerf', 'clean:b_modeproc']);
         'sweetjs:main', 'clean:b_modeproc',
         'uglify:donePerf', 'clean:b_sjs']);