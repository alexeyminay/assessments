FROM eclipse-temurin:22-jdk-alpine AS builder
WORKDIR /build
COPY . .
RUN ./gradlew installDist --no-daemon

FROM eclipse-temurin:22-jre-alpine
WORKDIR /app
COPY --from=builder /build/build/install/Assessments .
EXPOSE 8080
CMD ["./bin/Assessments"]
