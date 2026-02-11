FROM maven:3.9.6-eclipse-temurin-11 AS builder
WORKDIR /workspace
COPY pom.xml .
COPY src ./src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:11-jre
WORKDIR /app
COPY --from=builder /workspace/target/sunflower-backend-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
