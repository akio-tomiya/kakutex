FROM debian:12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    make \
    latexmk \
    texlive-luatex \
    texlive-latex-extra \
    texlive-fonts-recommended \
    texlive-lang-japanese \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /work
CMD ["make", "all"]
