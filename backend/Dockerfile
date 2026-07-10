# Build em duas fases: a primeira compila com Maven, a segunda
# só leva o jar final — a imagem fica muito mais pequena.

FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
# Copia primeiro o pom para aproveitar a cache das dependências
COPY pom.xml .
RUN mvn -q dependency:go-offline
COPY src ./src
RUN mvn -q package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
