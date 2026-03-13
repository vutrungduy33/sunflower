FROM maven:3.9.6-eclipse-temurin-11 AS builder
WORKDIR /workspace
ARG MAVEN_MIRROR=central
COPY .mvn/settings-docker.xml /tmp/settings-docker.xml
COPY pom.xml .
RUN case "${MAVEN_MIRROR}" in \
      central) ;; \
      aliyun) mkdir -p /root/.m2 && cp /tmp/settings-docker.xml /root/.m2/settings.xml ;; \
      *) echo "Unsupported MAVEN_MIRROR: ${MAVEN_MIRROR}" >&2; exit 1 ;; \
    esac \
  && mvn -B -ntp dependency:go-offline
COPY src ./src
RUN mvn -B -ntp -DskipTests package

FROM eclipse-temurin:11-jre
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*
COPY --from=builder /workspace/target/sunflower-backend-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
