plugins {
    `java-library`
    `maven-publish`
    signing
    jacoco
    checkstyle
    id("com.gradleup.nmcp") version "1.6.2"
    id("com.gradleup.nmcp.aggregation") version "1.6.2"
    id("com.diffplug.spotless") version "6.25.0"
}




group = "io.github.e-cloud"
version = "0.1.0"
description = "中国历代纪年、公历年份与天干地支双向互转库（基于哈佛/中研院/北大 CBDB 数据库）"

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(17))
    }
    withJavadocJar()
    withSourcesJar()
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("com.fasterxml.jackson.core:jackson-databind:2.18.2")

    testImplementation("org.junit.jupiter:junit-jupiter:5.11.4")
    testImplementation("org.assertj:assertj-core:3.27.3")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")

    nmcpAggregation(project)
}


tasks.withType<JavaCompile> {
    options.encoding = "UTF-8"
}

tasks.withType<Javadoc> {
    options.encoding = "UTF-8"
    (options as StandardJavadocDocletOptions).apply {
        charSet = "UTF-8"
        docEncoding = "UTF-8"
        addStringOption("Xdoclint:none", "-quiet")
    }
}

tasks.withType<Test> {
    useJUnitPlatform()
    testLogging {
        events("passed", "skipped", "failed")
    }
    finalizedBy(tasks.jacocoTestReport)
}

tasks.jacocoTestReport {
    dependsOn(tasks.test)
    reports {
        xml.required.set(true)
        html.required.set(true)
    }
}

tasks.named<ProcessResources>("processResources") {
    from("${rootProject.projectDir}/../data") {
        into("data")
        include("chronology_data.json")
    }
}

spotless {
    java {
        target("src/**/*.java")
        palantirJavaFormat()
        removeUnusedImports()
        trimTrailingWhitespace()
        endWithNewline()
    }
}

checkstyle {
    toolVersion = "10.21.4"
    configFile = file("${project.projectDir}/config/checkstyle/checkstyle.xml")
    isIgnoreFailures = false
    maxWarnings = 0
}

tasks.withType<Checkstyle> {
    reports {
        xml.required.set(false)
        html.required.set(true)
    }
}


publishing {
    publications {
        create<MavenPublication>("mavenJava") {
            from(components["java"])

            pom {
                name.set("china-chronology")
                description.set("中国历代纪年、公历年份与天干地支双向互转 Java 库")
                url.set("https://github.com/e-cloud/china_chronology")

                licenses {
                    license {
                        name.set("MIT License")
                        url.set("https://opensource.org/licenses/MIT")
                    }
                }

                developers {
                    developer {
                        id.set("e-cloud")
                        name.set("e-cloud")
                        email.set("e-cloud@users.noreply.github.com")
                    }
                }

                scm {
                    connection.set("scm:git:git://github.com/e-cloud/china_chronology.git")
                    developerConnection.set("scm:git:ssh://github.com:e-cloud/china_chronology.git")
                    url.set("https://github.com/e-cloud/china_chronology")
                }
            }
        }
    }

}

nmcpAggregation {
    centralPortal {
        username.set(
            project.findProperty("centralUsername") as? String
                ?: project.findProperty("mavenCentralUsername") as? String
                ?: System.getenv("CENTRAL_USERNAME")
                ?: System.getenv("SONATYPE_CENTRAL_USERNAME")
        )
        password.set(
            project.findProperty("centralPassword") as? String
                ?: project.findProperty("mavenCentralPassword") as? String
                ?: System.getenv("CENTRAL_PASSWORD")
                ?: System.getenv("SONATYPE_CENTRAL_PASSWORD")
        )
        publishingType.set("AUTOMATIC")
    }
}

signing {
    val signingKey = project.findProperty("signingKey") as? String
        ?: System.getenv("SIGNING_KEY")
        ?: System.getenv("GPG_SIGNING_KEY")
    val signingPassword = project.findProperty("signingPassword") as? String
        ?: System.getenv("SIGNING_PASSWORD")
        ?: System.getenv("GPG_SIGNING_PASSWORD")

    if (!signingKey.isNullOrEmpty()) {
        useInMemoryPgpKeys(signingKey, signingPassword)
        sign(publishing.publications["mavenJava"])
    }
}

