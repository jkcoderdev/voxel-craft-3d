(module $coordinator.wasm
 (type $0 (func (result i32)))
 (type $1 (func))
 (type $2 (func (param i32)))
 (type $3 (func (param i32 i32)))
 (global $__stack_pointer (mut i32) (i32.const 65536))
 (global $__stack_end (mut i32) (i32.const 0))
 (global $__stack_base (mut i32) (i32.const 0))
 (global $global$3 (mut i32) (i32.const 0))
 (global $global$4 (mut i32) (i32.const 0))
 (memory $0 257 257)
 (table $0 2 2 funcref)
 (elem $0 (i32.const 1) $__wasm_call_ctors)
 (export "memory" (memory $0))
 (export "_initialize" (func $_initialize))
 (export "__indirect_function_table" (table $0))
 (export "emscripten_stack_init" (func $emscripten_stack_init))
 (export "emscripten_stack_get_free" (func $emscripten_stack_get_free))
 (export "emscripten_stack_get_base" (func $emscripten_stack_get_base))
 (export "emscripten_stack_get_end" (func $emscripten_stack_get_end))
 (export "_emscripten_stack_restore" (func $_emscripten_stack_restore))
 (export "emscripten_stack_get_current" (func $emscripten_stack_get_current))
 (export "__set_stack_limits" (func $8))
 (func $__wasm_call_ctors
  (call $emscripten_stack_init)
 )
 (func $_initialize
  (block $block
   (br_if $block
    (i32.eqz
     (i32.const 1)
    )
   )
   (call $__wasm_call_ctors)
  )
 )
 (func $emscripten_stack_init
  (global.set $__stack_base
   (i32.const 65536)
  )
  (global.set $__stack_end
   (i32.and
    (i32.add
     (i32.const 0)
     (i32.const 15)
    )
    (i32.const -16)
   )
  )
 )
 (func $emscripten_stack_get_free (result i32)
  (i32.sub
   (global.get $__stack_pointer)
   (global.get $__stack_end)
  )
 )
 (func $emscripten_stack_get_base (result i32)
  (global.get $__stack_base)
 )
 (func $emscripten_stack_get_end (result i32)
  (global.get $__stack_end)
 )
 (func $_emscripten_stack_restore (param $0 i32)
  (local $1 i32)
  (if
   (i32.or
    (i32.gt_u
     (local.tee $1
      (local.get $0)
     )
     (global.get $global$3)
    )
    (i32.lt_u
     (local.get $1)
     (global.get $global$4)
    )
   )
   (then
    (unreachable)
   )
  )
  (global.set $__stack_pointer
   (local.get $1)
  )
 )
 (func $emscripten_stack_get_current (result i32)
  (global.get $__stack_pointer)
 )
 (func $8 (param $0 i32) (param $1 i32)
  (global.set $global$3
   (local.get $0)
  )
  (global.set $global$4
   (local.get $1)
  )
 )
 ;; custom section ".debug_abbrev", size 134
 ;; custom section ".debug_info", size 784
 ;; custom section ".debug_str", size 200
 ;; custom section ".debug_line", size 575
 ;; custom section ".debug_aranges", size 112
 ;; custom section ".debug_ranges", size 144
 ;; features section: mutable-globals, nontrapping-float-to-int, bulk-memory, sign-ext, reference-types, multivalue, bulk-memory-opt, call-indirect-overlong
)

