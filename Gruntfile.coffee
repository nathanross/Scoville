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
        src: 'src/benches'
        dest: 'gen/1.queued'
      byfile: 
        src: 'NA'
        dest: 'gen/1.queued'     
    shell:
      modespec:
        command: "src/macros/./basic_macro spec gen/1.Queued gen/2.modeprocess_done"
      modeperf:
        command: "src/macros/./basic_macro perf gen/1.Queued gen/2.modeprocess_done"
    sweetjs: 
      options: 
        modules : ["node_modules/minimalasm/mnlasm.sjs"]
        readableNames : true      
      main: 
        src : "gen/2.modeprocess_done"
        dest : "gen/3.minimalasm_done"      
      doneSpec: 
        src : "gen/2.modeprocess_done"
        dest : "gen/spec"  
      donePerf: 
        src : "gen/2.modeprocess_done"
        dest : "gen/perf"
    uglify : 
      doneSpec: 
        src : "gen/3.minimalasm_done"
        dest : "gen/spec"      
      donePerf: 
        src : "gen/3.minimalasm_done"
        dest : "gen/perf"    
    clean : 
      build: ["gen/1.queued/*", "gen/2.modeprocess_done/*", "gen/3/minimalasm_done/*"]
      all: ["gen/perf/*", "gen/spec/*",
          "gen/1.queued/*", "gen/2.modeprocess_done/*", "gen/3/minimalasm_done/*"] 
      # use all when you've renamed or deleted a previously existing bench
      

  tasksToLoad = [
              'grunt-contrib-watch'
              'grunt-mkdir'
              'grunt-contrib-copy'
              'grunt-shell'
              'grunt-sweet.js'
              'grunt-contrib-uglfy'
              'grunt-contrib-clean'
              'grunt-karma.js'
  ]

  (grunt.loadNpmTasks(i) for i in tasksToLoad); 

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
        ['mkdir:gen', 'copy:all', 'shell:modespec', 'sweetjs:main']);
  grunt.registerTask('compilePerfs',
        ['mkdir:gen', 'copy:all', 'shell:modeperf', 'sweetjs:main', 'uglify:donePerf'])