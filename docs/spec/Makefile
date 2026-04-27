PDF=dist/kakutex-spec-v1.5.pdf
BUILD=build
SRC=spec/main.tex

all: $(PDF)

$(PDF): $(SRC)
	mkdir -p $(BUILD) dist
	lualatex -interaction=nonstopmode -halt-on-error -output-directory=$(BUILD) $(SRC)
	lualatex -interaction=nonstopmode -halt-on-error -output-directory=$(BUILD) $(SRC)
	cp $(BUILD)/main.pdf $(PDF)

clean:
	rm -rf $(BUILD) dist/kakutex-spec-v1.5.pdf
