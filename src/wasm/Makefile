SHELL := cmd.exe
.SHELLFLAGS := /D /S /C

CC := emcc
CXX := em++
WASM_TO_WAT := $(EMSDK)/upstream/bin/wasm-dis.exe

SOURCE_DIR := source
WASM_DIR := bin
WAT_DIR := wat

C_SOURCES := $(wildcard $(SOURCE_DIR)/*.c)
CPP_SOURCES := $(wildcard $(SOURCE_DIR)/*.cpp)
SOURCE_NAMES := $(sort $(basename $(notdir $(C_SOURCES) $(CPP_SOURCES))))

WASM_FILES := $(addprefix $(WASM_DIR)/,$(addsuffix .wasm,$(SOURCE_NAMES)))
WAT_FILES := $(addprefix $(WAT_DIR)/,$(addsuffix .wat,$(SOURCE_NAMES)))

COMMON_FLAGS := -Wall -Wextra -Wpedantic -sSTANDALONE_WASM --no-entry
DEBUG_FLAGS := -O0 -g -sASSERTIONS=2
RELEASE_FLAGS := -O3 -flto
BUILD_FLAGS ?= $(DEBUG_FLAGS)

.PHONY: all debug release build clean

all: debug

debug:
	$(MAKE) clean
	$(MAKE) BUILD_FLAGS="$(DEBUG_FLAGS)" build

release:
	$(MAKE) clean
	$(MAKE) BUILD_FLAGS="$(RELEASE_FLAGS)" build

build: $(WASM_FILES) $(WAT_FILES)

$(WASM_DIR) $(WAT_DIR):
	@if not exist "$@" mkdir "$@"

$(WASM_DIR)/%.wasm: $(SOURCE_DIR)/%.c | $(WASM_DIR)
	$(CC) $(COMMON_FLAGS) $(BUILD_FLAGS) "$<" -o "$@"

$(WASM_DIR)/%.wasm: $(SOURCE_DIR)/%.cpp | $(WASM_DIR)
	$(CXX) $(COMMON_FLAGS) $(BUILD_FLAGS) "$<" -o "$@"

$(WAT_DIR)/%.wat: $(WASM_DIR)/%.wasm | $(WAT_DIR)
	"$(WASM_TO_WAT)" "$<" -o "$@"

clean:
	@if exist "$(WASM_DIR)" rmdir /S /Q "$(WASM_DIR)"
	@if exist "$(WAT_DIR)" rmdir /S /Q "$(WAT_DIR)"
